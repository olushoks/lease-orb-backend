const mongoose = require("mongoose");
const Joi = require("joi");

const leaseSchema = new mongoose.Schema({
  postedBy: { type: String, required: true },
  name: { type: String, required: true },
  availableDate: { type: Date, required: true },
  dateListed: { type: Date, default: Date.now },
  apartmentType: { type: String },
  rentPerMonth: { type: Number, required: true },
  city: { type: String, minlength: 3, required: true },
  state: { type: String, minlength: 2, required: true },
  zipCode: { type: String, minlength: 5, maxlength: 10, required: true },
  images: { data: Buffer, contentType: String },
});

const Lease = mongoose.model("Lease", leaseSchema);

exports.Lease = Lease;
exports.leaseSchema = leaseSchema;
