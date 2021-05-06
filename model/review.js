const mongoose = require("mongoose");
const Joi = require("joi");

const reviewSchema = mongoose.Schema({
    review_by: {type: String},
    review_date: {type: Date, default: Date.now()},
    review_text: {type: String, minlength:5, maxlength: 500, required: true},
    star_rating: {type: Number, maxlength: 5}
});

const Review = mongoose.model("Review", reviewSchema);

// VALIDATION FUNCTION
const validateReview = (review) => {
    const schema = Joi.object({
        review_comment: Joi.string().min(5).max(500).required(),
        star_rating: Joi.Number().max(5).required()
    });
    return schema.validate(review);
}

exports.reviewSchema = reviewSchema;
exports.review = Review;
exports.validateReview = validateReview;