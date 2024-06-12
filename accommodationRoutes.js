const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("./db");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/A_images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

router.post("/addRoom", upload.array("images"), (req, res) => {
  const {
    roomNumber,
    roomType,
    area,
    capacityAdult,
    capacityChild,
    pricePerDay,
    description,
    view,
    headlines,
    technologies,
    services,
    beds,
    baths,
  } = req.body;
  const imageFilenames = req.files.map((file) => file.filename);
  const capacity = JSON.stringify({
    Adult: capacityAdult,
    Child: capacityChild,
  });
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
    JSON.stringify(imageFilenames),
  ];

  db.query(sql, values, (err, result) => {
    if (err)
      return res.json({
        Message: "Error inserting room data into the database",
      });
    return res.json({ Status: "Success" });
  });
});

router.put("/updateRoom/:id", (req, res) => {
  const roomId = req.params.id;
  const {
    roomNumber,
    roomType,
    area,
    capacityAdult,
    capacityChild,
    pricePerDay,
    description,
    view,
    headlines,
    technologies,
    services,
    beds,
    baths,
  } = req.body;

  const capacity = JSON.stringify({
    Adult: capacityAdult,
    Child: capacityChild,
  });
  const sql = `
    UPDATE room SET
    r_name = ?, type = ?, area = ?, price = ?, r_discription = ?, view = ?, capacity = ?,
    bed_details = ?, technology = ?, bath_details = ?, r_highlight = ?, services = ?
    WHERE r_id = ?
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
    roomId,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ Status: "Error", Message: err.message });
    }
    res
      .status(200)
      .json({ Status: "Success", Message: "Room updated successfully" });
  });
});

router.get("/allRooms", (req, res) => {
  const sql = `
    SELECT 
      r_name, 
      r_id, 
      type, 
      JSON_UNQUOTE(JSON_EXTRACT(image, '$[0]')) AS first_image 
    FROM room
  `;
  db.query(sql, (err, data) => {
    if (err) return res.json({ Message: "Server Side Error" });
    return res.json({ Status: "Success", data });
  });
});

// router.delete("/deleteRoom/:id", (req, res) => {
//   const roomId = req.params.id;
//   const sql = "DELETE FROM room WHERE r_id = ?";
//   db.query(sql, [roomId], (err, result) => {
//     if (err) return res.json({ Message: "Server Side Error" });
//     return res.json({ Status: "Success" });
//   });
// });

router.delete("/deleteRoom/:id", (req, res) => {
  const roomId = req.params.id;

  // Fetch the images associated with the room
  const getImageSql = "SELECT image FROM room WHERE r_id = ?";
  db.query(getImageSql, [roomId], (err, data) => {
    if (err) {
      console.error("Error fetching images:", err);
      return res.json({ Message: "Server Side Error" });
    }

    if (data.length > 0) {
      const images = JSON.parse(data[0].image);

      // Delete the images from the filesystem
      images.forEach((image) => {
        const imagePath = path.join(
          "localhost:3000",
          "../public/A_images",
          image
        );
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Error deleting image ${image}:`, err);
          }
        });
      });

      // Delete the room from the database
      const deleteRoomSql = "DELETE FROM room WHERE r_id = ?";
      db.query(deleteRoomSql, [roomId], (err, result) => {
        if (err) {
          console.error("Error deleting room:", err);
          return res.json({ Message: "Server Side Error" });
        }
        return res.json({ Status: "Success" });
      });
    } else {
      return res.json({ Status: "Error", Message: "Room not found" });
    }
  });
});

router.get("/getRoom/:id", (req, res) => {
  const roomId = req.params.id;
  const sql = "SELECT * FROM room WHERE r_id = ?";
  db.query(sql, [roomId], (err, data) => {
    if (err) return res.json({ Status: "Error", Message: "Server Side Error" });
    if (data.length > 0) {
      return res.json({ Status: "Success", data: data[0] });
    } else {
      return res.json({ Status: "Error", Message: "Room not found" });
    }
  });
});

router.get("/getRoomForDisplay/:convertedType", (req, res) => {
  const type = req.params.convertedType;
  const sql = "SELECT * FROM room WHERE type = ?";
  db.query(sql, [type], (err, data) => {
    if (err) return res.json({ Status: "Error", Message: "Server Side Error" });
    if (data.length > 0) {
      return res.json({ Status: "Success", data });
    } else {
      return res.json({ Status: "Error", Message: "Room not found" });
    }
  });
});

module.exports = router;
