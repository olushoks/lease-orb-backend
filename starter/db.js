const config = require("config");
const mongoose = require("mongoose");

const connectDB = () => {
  mongoose
    .connect(config.get("mongoURI"), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log(`Connected to MongoDB`))
    .catch((err) => {
      console.log(`Unable to connect ${err}`);
      process.exit(1);
    });
};

module.exports = connectDB;
