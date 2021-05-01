const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");

const { User, validateUser } = require("../model/user");
const { Lease, validateLease } = require("../model/lease");
const { Message, validateMessage } = require("../model/message");

// USER SIGN-UP (CREATE NEW ACCOUNT)
router.post("/sign-up", async (req, res) => {
  try {
    // CHECK IF REQ BODY MEETS REQUIREMENT
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // CHECK IF USER ALREADY EXISTS
    let user = await User.findOne({ username: req.body.username });
    if (user)
      return res
        .status(401)
        .send({ status: 401, error: "user alreadt exists" });

    // SALT FOR PASSWORD HASH
    const salt = await bcrypt.genSalt(10);

    user = new User({
      _id: new mongoose.Types.ObjectId(),
      username: req.body.username,
      password: await bcrypt.hash(req.body.password, salt),
    });
    await user.save();

    const token = user.generateAuthToken();
    return res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send({
        _id: user._id,
        username: user.username,
        listedLease: user.listedLease,
        leaseInterestedIn: user.leaseInterestedIn,
        messages: user.messages,
      });
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error}`);
  }
});

// LIST LEASE
router.post("/:user/list-lease", async (req, res) => {
  try {
    const { error } = validateLease(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne({ username: req.params.user }).select({
      password: 0,
    });

    // ONLY ADD LEASE IF NONE DOES NOT CURRENTLY EXIST
    if (user.listedLease.length >= 1)
      return res.send(`You cannot have more than one active leases`);

    await user.save((err) => {
      if (err) return res.send(`${err}`);

      const lease = new Lease({
        postedBy: user.username,
        name: req.body.name,
        availableDate: req.body.availableDate,
        address: req.body.address,
        rent: req.body.rent,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        additionalInfo: req.body.additionalInfo,
        lat: req.body.lat,
        lng: req.body.lng,
        // images: {
        //   data: fs.readFileSync(
        //     path.join(__dirname + "/uploads/" + req.file.filename)
        //   ),
        // },
      });

      lease.save((err) => {
        if (err) return res.send(`${err}`);
      });
      user.listedLease.push(lease);
      user.save();
      // return res.send(lease);
      return res.send(user);
    });
  } catch (error) {
    return res.status(500).send(`Internal Server Error:: ${error}`);
  }
});

// EDIT LISTED LEASE
router.put("/:user/edit-lease/:leaseId", auth, async (req, res) => {
  try {
    const { error } = validateLease(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne({ username: req.params.user }).select({
      password: 0,
    });

    const lease = await Lease.findByIdAndUpdate(
      req.params.leaseId,
      {
        postedBy: user.username,
        name: req.body.name,
        availableDate: req.body.availableDate,
        apartmentType: req.body.apartmentType,
        rentPerMonth: req.body.rentPerMonth,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        additionalInfo: req.body.additionalInfo,
      },
      { new: true }
    );

    // SAVE UPDATE
    await lease.save();

    return res.send(lease);
  } catch (error) {
    return res.status(500).send(`Internal Server Error:: ${error}`);
  }
});

// REMOVE LEASE FROM BEEN AVAILABLE
router.delete("/:user/delist-lease/:leaseId", async (req, res) => {
  try {
    const id = req.params.leaseId;

    // DELETE LEASE FROM PROFILE OF USERS WHO SHOWED INTEREST
    const users = await User.find().populate("leaseInterestedIn");

    users.map((user) => {
      const updatedInterest = user.leaseInterestedIn.filter((lease) => {
        if (lease.id !== id) return true;
      });
      user.leaseInterestedIn = [...updatedInterest];
      user.save();
    });

    // DELETE LEASE DOCUMENT FROM LEASE COLLECTION
    await Lease.findByIdAndDelete(id);

    // DELETE LEASE OBJECT REFERENCE FROM USER DOCUMENT
    const user = await User.findOne({ username: req.params.user }).select({
      password: 0,
    });
    user.listedLease.pull(id);
    user.save();
    return res.send(user);
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error}`);
  }
});

// SEARCH AVAILABLE LEASE
router.get("/:user/search-lease/:criteria", async (req, res) => {
  try {
    const leases = await Lease.find().or([
      { zipCode: req.params.criteria },
      { city: req.params.criteria },
    ]);

    //if (leases.length === 0) return res.send();

    return res.send(leases);
  } catch (error) {
    return res.status(500).send(`Internal Server Error:: ${error}`);
  }
});

// SHOW INTEREST IN A LEASE
router.get("/:user/show-interest/:leaseId", auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.user }).select({
      password: 0,
    });
    const lease = await Lease.findOne({ _id: req.params.leaseId });

    // PREVENT USER FROM INDICATING INTEREST IN A LEASE THEY POSTED
    if (user.listedLease.includes(lease.id))
      return res.send(
        `You are not allowed to indicate interest in your own lease!`
      );

    // ONLY ADD LEASE IF IT IS NOT PRESENT IN THE ARRAY
    if (user.leaseInterestedIn.includes(lease.id))
      return res.send(
        `This lease is already in the leases you showed interest in`
      );

    user.leaseInterestedIn = [...user.leaseInterestedIn, lease.id];
    user.save();

    return res.send(user.leaseInterestedIn);
  } catch (error) {
    return res.status(500).send(`Internal Error: ${error}`);
  }
});

// REMOVE LEASE FROM LEASES INTERESTED IN
router.delete("/:user/withdraw-interest/:leaseId", auth, async (req, res) => {
  try {
    await User.findOne({ username: req.params.user })
      .populate("leaseInterestedIn")
      .exec((err, user) => {
        if (err) return handleError(err);
        const updatedLeasesInterestedIn = user.leaseInterestedIn.filter(
          (lease) => {
            if (lease.id !== req.params.leaseId) return true;
          }
        );

        user.leaseInterestedIn = [...updatedLeasesInterestedIn];

        user.save();
        res.send(updatedLeasesInterestedIn);
        res.send(user.leaseInterestedIn);
      });
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error}`);
  }
});

// CONTACT SELLER REGARDING POSTED LEASE
router.post(
  "/:user/contact-leaseholder/:leaseholder",
  auth,
  async (req, res) => {
    try {
      // CHECK IF REQ BODY MEETS REQUIREMENT
      const { error } = validateMessage(req.body);
      if (error) return res.status(400).send(error.details[0].message);

      const [user] = await User.find({ username: req.params.user });
      const [leaseHolder] = await User.find({
        username: req.params.leaseholder,
      });

      const message = new Message({
        title: req.body.title,
        conversation: [],
      });

      user.messages.push(message);
      user.messages[0].conversation.push({ type: "sent", text: req.body.text });

      leaseHolder.messages.push(message);
      leaseHolder.messages[0].conversation.push({
        type: "received",
        text: req.body.text,
      });

      await user.save();
      await leaseHolder.save();

      return res.send(user);
    } catch (error) {
      res.status(500).send(`Internal Server Error`);
    }
  }
);

module.exports = router;
