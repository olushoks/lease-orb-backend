const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { Review, validateReview } = require("../model/review");
//const { User } = require("../model/user")

// POST A REVIEW
router.post("/add_review/:user", async (req, res) => {
  try {
    // CHECK IF REVIEW MEETS REQUIREMENTS
    const { error } = validateReview(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // CHECK IF A REVIEW HAS BEEN PREVIOUSLY SUBMITTED BY THE USER
    // IF TRUE, UPDATE THE REVIEW WITH NEW DETAILS
    // IF FALSE, CREATE NEW REVIEW

    await Review.findOneAndUpdate(
      { review_by: req.params.user },
      {
        review_by: req.body.review_by,
        review_date: Date.now(),
        review_text: req.body.review_text,
        star_rating: req.body.star_rating,
      },
      { upsert: true, new: true }
    );

    const allReviews = await Review.find();

    return res.status(200).send(allReviews);
  } catch (error) {
    return res.status(500).send(`Internal server error: ${error}`);
  }
});

// SEARCH AND RETURN ALL REVIEWS
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find();

    return res.status(201).send(reviews);
  } catch (error) {
    return res.status(500).send(`Internal server error: ${error}`);
  }
});

module.exports = router;
