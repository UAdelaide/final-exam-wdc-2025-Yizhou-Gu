const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2/promise');

const app = express();


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'DogWalkService'
});
//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'dogwalk-secret-key',
  resave: false,
  saveUninitialized: false
}));
// Routes
const userRoutes = require('./routes/userRoutes');
const walkRoutes = require('./routes/walkRoutes');

app.use('/api/users', userRoutes);
app.use('/api/walks', walkRoutes);

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Login logic
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Users WHERE username = ? AND password_hash = ?',
      [username, password]
    );
    if (rows.length === 1) {
      const user = rows[0];
      req.session.user = {
        username: user.username,
        role: user.role
      };
      if (user.role === 'owner') {
        res.redirect('/owner-dashboard.html');
      } else if (user.role === 'walker') {
        res.redirect('/walker-dashboard.html');
      } else {
        res.status(400).send('Unknown role');
      }
    } else {
      res.status(401).send('Invalid username or password');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
// Export the app instead of listening here
module.exports = app;