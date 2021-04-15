const mongoose = require("mongoose");
const Joi = require("joi");

const User = require("./user");

const leaseSchema = new mongoose.Schema({
  postedBy: { type: String, required: true },
  name: { type: String, required: true },
  dateListed: { type: Date, default: Date.now },
  availableDate: { type: Date, required: true },
  apartmentType: { type: String },
  rentPerMonth: { type: Number, required: true },
  city: { type: String, minlength: 3, required: true },
  state: { type: String, minlength: 2, required: true },
  zipCode: { type: String, minlength: 5, maxlength: 10, required: true },
  images: { data: Buffer, contentType: String },
  additionalInfo: { type: String },
});

const Lease = mongoose.model("Lease", leaseSchema);

// VALIDATION FUNCTION
const validateLease = (lease) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    availableDate: Joi.date().required(),
    apartmentType: Joi.string(),
    rentPerMonth: Joi.number().required(),
    city: Joi.string().min(3).required(),
    state: Joi.string().min(2).required(),
    zipCode: Joi.string().min(5).max(10).required(),
    additionalInfo: Joi.string(),
  });
  return schema.validate(lease);
};

exports.Lease = Lease;
exports.leaseSchema = leaseSchema;
exports.validateLease = validateLease;
