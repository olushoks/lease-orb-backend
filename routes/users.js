const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");

const { User, validateUser } = require("../model/user");
const { Lease, validateLease } = require("../model/lease");

// USER SIGN-UP (CREATE NEW ACCOUNT)
router.post("/sign-up", async (req, res) => {
  try {
    // CHECK IF REQ BODY MEETS REQUIREMENT
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // CHECK IF USER ALREADY EXISTS
    let user = await User.findOne({ username: req.body.username });
    if (user) return res.status(400).send(`User already exists`);

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
      .send({ _id: user._id, username: user.username });
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error}`);
  }
});

// LIST LEASE
router.post("/:user/list-lease", auth, async (req, res) => {
  try {
    const { error } = validateLease(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne({ username: req.params.user }).select({
      password: 0,
    });

    await user.save((err) => {
      if (err) return res.send(`${err}`);

      const lease = new Lease({
        postedBy: user.username,
        name: req.body.name,
        availableDate: req.body.availableDate,
        apartmentType: req.body.apartmentType,
        rentPerMonth: req.body.rentPerMonth,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        additionalInfo: req.body.additionalInfo,
      });

      lease.save((err) => {
        if (err) return res.send(`${err}`);
      });
      user.listedLease = lease;
      user.save();
    });

    return res.send(user);
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
router.delete("/:user/delist-lease/:leaseId", auth, async (req, res) => {
  try {
    const id = req.params.leaseId;

    // DELETE LEASE OBJECT REFERENCE FROM USER DOCUMENT
    const user = await User.findOne({ username: req.params.user });
    user.listedLease.pull(id);
    user.save();
    
    // DELETE LEASE FROM PROFILE OF USERS WHO SHOWED INTEREST
    const users = await User.find()
    .populate("leaseInterestedIn")
    
    users.map((user) => {
      const updatedInterest = user.leaseInterestedIn.filter((lease) => {
        if (lease.id !== id) return true;
      });
      user.leaseInterestedIn = [...updatedInterest];
      user.save();
    })

    // DELETE LEASE DOCUMENT FROM LEASE COLLECTION
    // const leaseToUnlist = await Lease.findByIdAndDelete(id);
    // await leaseToUnlist.save();
          
    return res.send(users);
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
router.get("/:user/show-interest/:leaseId", auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.user }).select({
      password: 0,
    });
    const lease = await Lease.findOne({ _id: req.params.leaseId });

    // PREVENT USER FROM INDICATING INTEREST IN A LEASE THEY POSTED
    if (user.listedLease.includes(lease.id)) return res.send(`You are not allowed to indicate interest in your own lease!`);

    // ONLY ADD LEASE IF IT IS NOT PRESENT IN THE ARRAY
    if (user.leaseInterestedIn.includes(lease.id))
      return res.send(
        `This lease is already in the leases you showed interest in`
      );

    user.leaseInterestedIn = [...user.leaseInterestedIn, lease.id];
    user.save();

    return res.send(user.leaseInterestedIn);
    //return res.send(lease.id);
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
        // res.send(user.leaseInterestedIn);
      });
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error}`);
  }
});

module.exports = router;
