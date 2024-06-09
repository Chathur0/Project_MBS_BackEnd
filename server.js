const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const db = require("./db");
const accommodationRoutes = require("./accommodationRoutes");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'))
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET" , "POST","DELETE","PUT"],
    credentials: true,
  })
);
const verifyUser = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.json({valid: false, Massage: "we need token please provide it." });
  } else {
    jwt.verify(token, "myToken", (err, decoded) => {
      if (err) {
        return res.json({valid: false, Massage: "Authentication Error." });
      } else {
        req.userId = decoded.userId;
        req.name = decoded.name;
        next();
      }
    });
  }
};

app.post("/login", (req, res) => {
  const sql = "SELECT * FROM user WHERE email = ? AND password = ?";
  db.query(sql, [req.body.email, req.body.password], (err, data) => {
    if (err) return res.json({ Message: "Sever Side Error" });
    if (data.length > 0) {
      const name = data[0].f_name;
      const userId = data[0].u_id;
      GUser = data[0].u_id;
      const token = jwt.sign({ name, userId }, "myToken", { expiresIn: "1d" });
      res.cookie("token", token, { httpOnly: true, sameSite: 'Strict' });
      return res.json({ Status: "Success", token  });
    } else {
      return res.json({ Message: "No Record exists in database" });
    }
  });
});

app.get("/checkAdmin", verifyUser, (req, res) => {
  const sql = `
    SELECT u.u_id, 
    CASE 
      WHEN a.u_id IS NOT NULL THEN 'Admin' 
      ELSE 'Not Admin' 
    END AS isAdmin 
    FROM user u 
    LEFT JOIN admin a ON u.u_id = a.u_id 
    WHERE u.u_id = ?
  `;
  db.query(sql, [req.userId], (err, data) => {
    if (err) return res.json({ Message: "Server Side Error" });
    if (data.length > 0) {
      return res.json({ Status: "Success", isAdmin: data[0].isAdmin });
    } else {
      return res.json({ Status: "Failure", Message: "User not found" });
    }
  });
});

app.get("/logout", (req, res)=>{
  res.clearCookie("token");
    console.log("gone");
    return res.json({Status: "Success"});
})
app.get("/checkToken", verifyUser, (req, res) => {
  return res.json({ valid: true, userId: req.userId, name: req.name });
});

app.use("/accommodation", accommodationRoutes);

app.listen(3000, () => {
  console.log("running");
});
