const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET" , "POST"],
    credentials: true,
  })
);

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mbs_db",
});

const verifyUser = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.json({ valid: false, Message: "We need a token, please provide it." });
  } else {
    jwt.verify(token, "myToken", (err, decoded) => {
      if (err) {
        return res.json({ valid: false, Message: "Authentication Error." });
      } else {
        req.userId = decoded.userId;
        req.name = decoded.name;
        next();
      }
    });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/A_images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

