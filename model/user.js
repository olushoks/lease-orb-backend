const mongoose = require("mongoose");
const { leaseSchema } = require("./lease");
const { messageSchema } = require("./message");
const Joi = require("joi");

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
