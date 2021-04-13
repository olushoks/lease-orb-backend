const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./starter/db");
const users = require("./routes/users");

// CONNECTT TO DATABASE
connectDB();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/users", users);

// INITIATE PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
