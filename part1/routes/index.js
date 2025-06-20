var express = require('express');
var router = express.Router();
const mysql = require('mysql2/promise');


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'DogWalkService'
});


router.get('/', function(req, res, next) {
  res.render('index', { title: 'DogWalkService API' });
});


router.get('/api/dogs', async function (req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
      WHERE u.role = 'owner'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/api/walkrequests/open', async function (req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location,
             u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/api/walkers/summary', async function (req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT u.username AS walker_username,
             COUNT(r.rating) AS total_ratings,
             ROUND(AVG(r.rating), 1) AS average_rating,
             SUM(CASE WHEN wr.status = 'completed' THEN 1 ELSE 0 END) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRequests wr ON u.user_id = wr.walker_id
      LEFT JOIN WalkRatings r ON wr.request_id = r.request_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
