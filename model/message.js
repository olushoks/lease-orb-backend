const mongoose = require("mongoose");
const Joi = require("joi");

const messageSchema = mongoose.Schema({
  title: { type: String },
  conversation: { type: [], default: [], required: true },
  recipient: { type: String },
});

const Message = mongoose.model("Message", messageSchema);

const validateMessage = (message) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    conversation: Joi.array().required(),
    text: Joi.string(),
  });
  return schema.validate(message);
};

exports.messageSchema = messageSchema;
exports.Message = Message;
exports.validateMessage = validateMessage;
