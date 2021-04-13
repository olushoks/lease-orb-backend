const mongoose = require("mongoose");
const Joi = require("joi");

const messageSchema = mongoose.Schema({
  text: { type: String, minlength: 1, maxlength: 100, required: true },
  type: { type: String, required: true },
});

const Message = mongoose.model("Message", messageSchema);

exports.messageSchema = messageSchema;
exports.Message = Message;
