const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');
const expressLayouts = require('express-ejs-layouts');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session
app.use(session({
  secret: 'talent_query_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// --- DATABASE CONNECTION (FIXED FOR RENDER/TiDB) ---

const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT),
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
};

// Создаем пул соединений вместо одиночного db
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Проверка подключения (выведется в логи Render)
pool.getConnection((err, connection) => {
  if (err) {
    console.error('--- DATABASE ERROR ---');
    console.error(err);
  } else {
    console.log('Successfully connected to TiDB Cloud via Pool!');
    connection.release();
  }
});

// СУПЕР-ВАЖНО: Делаем пул доступным для всех твоих роутов
// Мы заменяем старую переменную 'db' этим пулом
global.db = pool;

// --- Routes ---
const indexRoutes = require('./routes/index');
const blogRoutes = require('./routes/blog');
const jobsRoutes = require('./routes/jobs');
const candidatesRoutes = require('./routes/candidates');
const authRoutes = require('./routes/authRoutes').router;

const contactRoutes = require('./routes/contactRoutes');

app.use('/', indexRoutes);
app.use('/blog', blogRoutes);
app.use('/jobs', jobsRoutes);
app.use('/candidates', candidatesRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found', page: '' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
