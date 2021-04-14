const mongoose = require("mongoose");
const { leaseSchema } = require("./lease");
const { messageSchema } = require("./message");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: 6,
    maxlength: 12,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    minlength: 8,
    required: true,
  },
  listedLease: { type: [leaseSchema], default: [] },
  messages: { type: [messageSchema], default: [] },
});

// METHOD TO GENERATE JWT TOKEN
userSchema.methods.generateAuthToken = () => {
  return jwt.sign(
    { _id: this._id, username: this.username },
    config.get("jwtSecret")
  );
};

const User = mongoose.model("User", userSchema);

// VALIDATION FUNCTION
const validateUser = (user) => {
  const schema = Joi.object({
    username: Joi.string().min(6).max(12).required(),
    password: Joi.string().min(8).required(),
  });
  return schema.validate(user);
};

exports.User = User;
exports.validateUser = validateUser;
