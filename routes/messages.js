const express = require("express");
const router = express.Router();

router.post("/:user/message/:leaseId", auth, async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error}`);
  }
});

module.exports = router;
