const express = require("express");
const multer = require('multer');
const path = require('path');
const router = express.Router();
const db = require("./db");
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/slip');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/book-room', upload.single('b_slip'), (req, res) => {
  const {
    u_id,
    r_id,
    package,
    b_date,
    check_in,
    check_out,
    b_cost
  } = req.body;

  const b_slip = req.file ? `${req.file.filename}` : null;

  const query = `
    INSERT INTO book_room (u_id, r_id, package, b_date, check_in, check_out, b_cost, b_slip, approve)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [u_id, r_id, package, b_date, check_in, check_out, b_cost, b_slip, 0], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database insertion failed' });
    } else {
      res.status(200).json({ message: 'Booking saved successfully' });
    }
  });
});

router.get('/pending-approval', (req, res) => {
  const query = `SELECT 
  u.f_name,
  u.m_number,
  r.r_name,
  r.type,
  b.b_date,
  b.check_in,
  b.check_out,
  b.package,
  b.b_cost,
  b.b_slip,
  b.b_id
FROM 
  book_room b
JOIN 
  user u ON b.u_id = u.u_id
JOIN 
  room r ON b.r_id = r.r_id
WHERE 
  b.approve = 0;
`;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database query failed' });
    } else {
      res.status(200).json(results);
    }
  });
});

router.post('/approve-booking', (req, res) => {
  const { b_id } = req.body;

  const query = `
    UPDATE book_room
    SET approve = 1
    WHERE b_id = ?
  `;

  db.query(query, [b_id], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database update failed' });
    } else {
      res.status(200).json({ message: 'Booking approved successfully' });
    }
  });
});

router.get('/approved', (req, res) => {
  const query = `SELECT 
  u.f_name,
  u.m_number,
  u.email,
  u.status,
  r.r_name,
  r.type,
  b.check_in,
  b.check_out,
  b.package,
  b.b_id,
  b.b_slip
FROM 
  book_room b
JOIN 
  user u ON b.u_id = u.u_id
JOIN 
  room r ON b.r_id = r.r_id
WHERE 
  b.approve = 1;
`;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database query failed' });
    } else {
      res.status(200).json(results);
    }
  });
});

router.delete('/bookings/:id', (req, res) => {
  const { id } = req.params;

  const deleteBookingQuery = 'DELETE FROM book_room WHERE b_id = ?';

  db.query(deleteBookingQuery, [id], (err, result) => {
    if (err) {
      console.error("Error deleting booking:", err);
      res.status(500).json({ error: "Failed to delete booking" });
    } else {
      res.status(200).json({ message: "Booking deleted successfully" });
    }
  });
});

router.delete('/delete-slip/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join('localhost:3000', '../public/slip', filename);
  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error("Error deleting slip image:", err);
      res.status(500).json({ error: "Failed to delete slip image" });
    } else {
      res.status(200).json({ message: "Slip image deleted successfully" });
    }
  });
});

router.get('/booked-rooms', (req, res) => {
  const roomType = req.query.type;

  const query = `
    SELECT
      r.r_id,
      r.r_name,
      r.type,
      r.bed_details,
      r.capacity,
      r.price,
      r.image,
      b.check_in,
      b.check_out
    FROM
      room r
    JOIN
      book_room b ON r.r_id = b.r_id
    WHERE
      r.type = ? AND
      b.approve = 1
  `;

  db.query(query, [roomType], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database query failed' });
    } else {
      res.status(200).json(results);
    }
  });
});


module.exports = router;