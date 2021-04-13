const mongoose = require("mongoose");
const Joi = require("joi");
const { validateLease } = require("./lease");

const messageSchema = mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  text: { type: String, minlength: 1, maxlength: 100, required: true },
});

const Message = mongoose.model("Message", messageSchema);

const validateMessage = (message) => {
  const schema = Joi.object({
    title: Joi.strinig().required(),
    type: Joi.string().required(),
    text: Joi.string().min(1).max(100).required(),
  });
  return schema.validate(message);
};

exports.messageSchema = messageSchema;
exports.Message = Message;
exports.validateMessage = validateMessage;
