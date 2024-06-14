const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'YourPassword',
  database: 'YourDatabase'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

app.get('/getPreviousVolunteerWork', (req, res) => {
  const query = 'SELECT * FROM `previous_v_work` WHERE 1';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching previous volunteer work:', err);
      res.status(500).send({ Status: 'Error', Error: err });
    } else {
      res.send({ Status: 'Success', data: results });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
