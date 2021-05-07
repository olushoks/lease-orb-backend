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
    if (user) return res.status(401).send("user already exists");

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
        if (lease.id != id) return true;
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

    return res.send(leases);
  } catch (error) {
    return res.status(500).send(`Internal Server Error:: ${error}`);
  }
});

// SHOW INTEREST IN A LEASE
router.post("/:user/show-interest/:leaseId", async (req, res) => {
  try {
    let user = await User.findOne({ username: req.params.user }).select({
      password: 0,
    });

    const lease = await Lease.findOne({ _id: req.params.leaseId });

    // PREVENT USER FROM INDICATING INTEREST IN A LEASE THEY POSTED
    if (user.listedLease.includes(lease.id))
      return res.status(400).send({
        error1: `You are not allowed to indicate interest in your own lease!`,
      });

    // ONLY ADD LEASE IF IT IS NOT PRESENT IN THE ARRAY
    if (user.leaseInterestedIn.includes(lease.id))
      return res.status(400).send({
        error2: `This lease is already in the leases you showed interest in`,
      });

    user.leaseInterestedIn = [...user.leaseInterestedIn, lease];

    await user.execPopulate("leaseInterestedIn");
    await user.execPopulate("listedLease");

    // AUTO GENERATED MESSAGE UPON USER SUCCESFULLY INDICATING INITEREST
    const leaseHolder = await User.findOne({
      username: lease.postedBy,
    });

    const message = new Message({
      title: `From ${user.username} for ${lease.name}`,
      conversation: [],
    });

    const text = `Hi, my name is ${user.username}, and I am interested in the lease you recently put up`;

    user.messages.unshift(message);
    user.messages[0].conversation.push({
      type: "sent",
      text,
    });
    user.messages[0].recipient = leaseHolder.username;

    leaseHolder.messages.unshift(message);
    leaseHolder.messages[0].conversation.push({
      type: "received",
      text,
    });
    leaseHolder.messages[0].recipient = user.username;

    await user.save();
    await leaseHolder.save();

    return res.send(user);
  } catch (error) {
    return res.status(500).send(`Internal Error: ${error}`);
  }
});

// REMOVE LEASE FROM LEASES INTERESTED IN
router.delete("/:user/withdraw-interest/:leaseId", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.user })
      .populate("leaseInterestedIn")
      .populate("listedLease")
      .select({
        password: 0,
      });

    const updatedLeasesInterestedIn = user.leaseInterestedIn.filter((lease) => {
      if (lease._id != req.params.leaseId) return true;
    });

    user.leaseInterestedIn = [...updatedLeasesInterestedIn];

    await user.save();

    return res.send(user);
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error}`);
  }
});

// REPLY TO MESSAGE(S)
router.post(
  "/:sender/reply-message/:message_id/:receiver",
  async (req, res) => {
    try {
      const [sender] = await User.find({ username: req.params.sender }).select({
        password: 0,
      });

      const [receiver] = await User.find({
        username: req.params.receiver,
      }).select({ password: 0 });

      const text = req.body.text;

      const senderMessage = sender.messages.id(req.params.message_id);

      const receiverMessage = receiver.messages.id(req.params.message_id);

      senderMessage.conversation.push({ type: "sent", text });
      receiverMessage.conversation.push({ type: "received", text });

      await sender.save();
      await receiver.save();

      return res.send(sender);
    } catch (error) {
      res.status(500).send(`Internal Server Error`);
    }
  }
);

module.exports = router;
