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
    methods: ["GET", "POST"],
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
    return res.json({ valid: false, Message: "we need token please provide it." });
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
      return res.json({ Status: "Success", token });
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

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  console.log("gone");
  return res.json({ Status: "Success" });
});

app.get("/checkToken", verifyUser, (req, res) => {
  return res.json({ valid: true, userId: req.userId, name: req.name });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/A_images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

app.post("/addRoom", upload.array('images'), (req, res) => {
  const { roomNumber, roomType, area, capacityAdult, capacityChild, pricePerDay, description, view, headlines, technologies, services, beds, baths } = req.body;
  
  const imageFilenames = req.files.map(file => file.filename);
  const capacity = JSON.stringify({ Adult: capacityAdult, Child: capacityChild });
  const sql = `
    INSERT INTO room (r_name, type, area, price, r_discription, view, capacity, bed_details, technology, bath_details, r_highlight, services, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    roomNumber,
    roomType,
    area,
    pricePerDay,
    description,
    view,
    capacity,
    JSON.stringify(beds),
    JSON.stringify(technologies),
    JSON.stringify(baths),
    JSON.stringify(headlines),
    JSON.stringify(services),
    JSON.stringify(imageFilenames)
  ];
  
  db.query(sql, values, (err, result) => {
    if (err) return res.json({ Message: "Error inserting room data into the database" });
    return res.json({ Status: "Success" });
  });
});

// Add this code in your server.js file
app.put("/updateVolunteerTeacherStatus", (req, res) => {
  const { id, status } = req.body;
  const sql = "UPDATE v_teacher SET vt_status = ? WHERE vt_id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ Message: "Error updating volunteer teacher status" });
    }
    return res.json({ Status: "Success" });
  });
});

app.post("/addVolunteerWork", upload.single('image'), (req, res) => {
  const { name, country, date, description, link } = req.body;
  const imageFilename = req.file ? req.file.filename : null;
  const sql = `
    INSERT INTO previous_v_work (pvw_name, pvw_country, pvw_image, pvw_date, pvw_description, pvw_link)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [name, country, imageFilename, date, description, link];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ Message: "Error inserting volunteer data into the database" });
    }
    return res.json({ Status: "Success" });
  });
});

app.post("/addVolunteerWork", upload.single('image'), (req, res) => {
  const { name, country, date, description, link } = req.body;
  const imageFilename = req.file ? req.file.filename : null;
  const sql = `
    INSERT INTO previous_v_work (pvw_name, pvw_country, pvw_image, pvw_date, pvw_description, pvw_link)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [name, country, imageFilename, date, description, link];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ Message: "Error inserting volunteer data into the database" });
    }
    return res.json({ Status: "Success" });
  });
});

// New endpoint to get previous volunteer work
app.get("/getPreviousVolunteerWork", (req, res) => {
  const sql = "SELECT * FROM previous_v_work";
  db.query(sql, (err, data) => {
    if (err) return res.json({ Message: "Server Side Error" });
    console.log(res);
    return res.json({ Status: "Success", data });
  });
});

app.post("/updateVolunteerStatus", verifyUser, (req, res) => {
  const { volunteerId, status } = req.body;
  const sql = "UPDATE v_teacher SET vt_status = ? WHERE vt_id = ?";
  db.query(sql, [status, volunteerId], (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ Message: "Error updating volunteer status" });
    }
    return res.json({ Status: "Success" });
  });
});


// New endpoint for volunteer teacher registration
app.post("/registerVolunteerTeacher", upload.single('cv'), verifyUser, (req, res) => {
  const { name, country, skills, description } = req.body;
  const cvFilename = req.file ? req.file.filename : null;
  const userId = req.userId;

  const sql = `
    INSERT INTO v_teacher (vt_name, vt_country, vt_skill, vt_description, vt_cv, u_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [name, country, skills, description, cvFilename, userId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ Message: "Error inserting volunteer teacher data into the database" });
    }
    return res.json({ Status: "Success" });
  });
});

// New endpoint to get volunteer teacher data
app.get("/getVolunteerTeachers", (req, res) => {
  const sql = "SELECT * FROM v_teacher WHERE 1";
  db.query(sql, (err, data) => {
    if (err) return res.json({ Message: "Server Side Error" });
    return res.json({ Status: "Success", data });
  });
});


app.listen(3000, () => {
  console.log("running");
});

