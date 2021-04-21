const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Joi = require("joi");
const { User } = require("../model/user");

// USER SIGN IN
router.post("/sign-in", async (req, res) => {
  try {
    const { error } = validateSignIn(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // CHECK IF USER EXISTS IN DATABASE
    let user = await User.findOne({ username: req.body.username })
      .populate("leaseInterestedIn")
      .populate("listedLease")
      .exec();

    if (!user) return res.status(400).send(`Invalid username or password`);

    // CHECK PASSWORD ACCURACY
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword)
      return res.status(400).send(`Invalid username or password`);

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

// VALIDATION FUNCTION FOR USER SIGN IN
const validateSignIn = (user) => {
  const schema = Joi.object({
    username: Joi.string().min(6).max(12).required(),
    password: Joi.string().min(8).required(),
  });
  return schema.validate(user);
};

module.exports = router;
