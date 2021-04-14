const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");

const { User, validateUser } = require("../model/user");

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

module.exports = router;
