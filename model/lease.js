const mongoose = require("mongoose");
const Joi = require("joi");

const User = require("./user");
const { number } = require("joi");

const leaseSchema = new mongoose.Schema({
  postedBy: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  dateListed: { type: Date, default: Date.now },
  availableDate: { type: Date, required: true },
  rent: { type: Number, required: true },
  city: { type: String, minlength: 3, required: true },
  state: { type: String, minlength: 2, required: true },
  zipCode: { type: String, minlength: 5, maxlength: 10, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  images: { data: Buffer, contentType: String },
  additionalInfo: { type: String },
});

const Lease = mongoose.model("Lease", leaseSchema);

// VALIDATION FUNCTION
const validateLease = (lease) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    availableDate: Joi.date().required(),
    address: Joi.string(),
    rent: Joi.number().required(),
    city: Joi.string().min(3).required(),
    state: Joi.string().min(2).required(),
    zipCode: Joi.string().min(5).max(10).required(),
    additionalInfo: Joi.string(),
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  });
  return schema.validate(lease);
};

exports.Lease = Lease;
exports.leaseSchema = leaseSchema;
exports.validateLease = validateLease;
