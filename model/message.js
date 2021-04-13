const mongoose = require("mongoose");
const Joi = require("joi");
const { validateLease } = require("./lease");

const messageSchema = mongoose.Schema({
  text: { type: String, minlength: 1, maxlength: 100, required: true },
  type: { type: String, required: true },
});

const Message = mongoose.model("Message", messageSchema);

const validateMessage = (message) => {
  const schema = Joi.object({
    text: Joi.string().min(1).max(100).required(),
    type: Joi.string().required(),
  });
};

exports.messageSchema = messageSchema;
exports.Message = Message;
exports.validateMessage = validateMessage;
