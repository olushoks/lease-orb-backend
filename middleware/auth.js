const jwt = require("jsonwebtoken");
const config = require("config");

const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send(`Access denied`);

  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    req, (user = decoded);
  } catch (error) {
    return res.status(400).send(`Invalid token`);
  }
};

module.exports = auth;