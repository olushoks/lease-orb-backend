const express = require("express");
const app = express();
const cors = require("cors");
//const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const connectDB = require("./starter/db");
const users = require("./routes/users");
const reviews = require("./routes/reviews");
const auth = require("./routes/auth");

// CONNECTT TO DATABASE
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now());
    }
});

const upload = multer({stroage: storage});


// ROUTES
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/reviews", reviews)

// INITIATE PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));


