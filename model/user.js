const mongoose = require("mongoose");
const { leaseSchema } = require("./lease");
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
  messages: {},
});

const User = mongoose.model("User", userSchema);

exports.User = User;
