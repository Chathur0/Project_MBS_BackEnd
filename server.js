const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cookieParser());
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
  database: "abc_db",
});

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Massage: "we need token please provide it." });
  } else {
    jwt.verify(token, "myToken", (err, decoded) => {
      if (err) {
        return res.json({ Massage: "Authentication Error." });
      } else {
        req.name = decoded.name;
        next();
      }
    });
  }
};
app.get("/", verifyUser, (req, res) => {
  return res.json({Status: "Success", name: req.name });
});
app.post("/login", (req, res) => {
  const sql = "SELECT * FROM login WHERE email = ? AND password = ?";
  db.query(sql, [req.body.email, req.body.password], (err, data) => {
    if (err) return res.json({ Message: "Sever Side Error" });
    if (data.length > 0) {
      const name = data[0].name;
      const token = jwt.sign({ name }, "myToken", { expiresIn: "1d" });
      res.cookie("token", token);
      return res.json({ Status: "Success" });
    } else {
      return res.json({ Message: "No Record exists in database" });
    }
  });
});

app.get("/logout", (req, res)=>{
    res.clearCookie('token');
    return res.json({Status: "Success"});
})

app.listen(3000, () => {
  console.log("running");
});
