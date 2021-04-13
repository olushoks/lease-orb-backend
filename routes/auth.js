const express = require("express");
const router = express.Router();

const { User } = require("../model/user");

// USER SIGN IN
router.post("/sign-in", async (req, res) => {
  try {
    const { error } = validateSignIn(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).send(`Invalid username or password`);
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
