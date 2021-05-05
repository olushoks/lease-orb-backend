const mongoose = require("mongoose");
const Joi = require("joi");

const reviewSchema = mongoose.Schema({
    review_by: {type: String},
    review_date: {type: Date, default: Date.now()},
    review_comment: {type: String, minlength:5, maxlength: 500, required: true}
});

const Review = mongoose.model("Review", reviewSchema);

