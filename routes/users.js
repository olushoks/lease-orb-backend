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

// DELETE

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

    // ONLY ADD LEASE IF IT IS NOT PRESENT IN THE ARRAY
    if (!user.leaseInterestedIn.includes(lease))
      return res.send(
        `This lease is already in the leases you showed interest in`
      );

    user.leaseInterestedIn.push(lease);
    // user.leaseInterestedIn.includes(lease) ||
    //   user.leaseInterestedIn.push(lease);
    user.save();

    return res.send(user);
  } catch (error) {
    return res.status(500).send(`Internal Error: ${error}`);
  }
});

module.exports = router;
