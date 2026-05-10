// app.js (или server.js)
const db = require('./db'); // Проверь правильность пути до твоего файла базы данных
const express = require('express');
const path = require('path');
const session = require('express-session');
const PORT = process.env.PORT || 3000;
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');

const app = express();
// Настройка сессий
app.use(session({
  secret: 'chinaspainportugal', // Используйте один секрет
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 часа. Это обеспечит выполнение ТЗ "оставаться залогиненным"
    secure: false // true только если у вас HTTPS (на локалке false)
  }
}));


// Настройка connect-flash
app.use(flash());

// Конфигурация для работы с POST-запросами и статическими файлами
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    // Передаем в EJS данные и кандидата, и работодателя/админа
    res.locals.currentUser = req.session.candidateId || null;
    res.locals.employerUser = req.session.employerUser || null; 
    next();
});

// Установка EJS в качестве шаблонизатора
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Использование middleware express-ejs-layouts
app.use(expressLayouts);

// Подключение маршрутов
const indexRoutes = require('./routes/index');
const blogRoutes = require('./routes/blog');
const jobsRoutes = require('./routes/jobsRoutes');
const employerAuthRoutes = require('./routes/employerAuthRoutes'); 
// Новый файл
const { isAuthenticated } = require('./routes/authRoutes'); 
const candidatesRoutes = require('./routes/candidates');
const authRoutes = require('./routes/authRoutes').router;

const contactRoutes = require('./routes/contactRoutes');

app.use('/', contactRoutes);

// Use routes
app.use('/', indexRoutes);
app.use('/blog', blogRoutes);
app.use('/jobs', jobsRoutes);
app.use('/candidates', candidatesRoutes);
app.use('/auth', authRoutes);
app.use('/', employerAuthRoutes); // Подключаем маршруты аутентификации работодателей

// Пример простого роута для главной страницы (если у вас его нет)
app.get('/', (req, res) => {
  res.render('index', { title: 'Welcome to Talent Query' });
});

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dbConfig = {
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'talent_query_db',
  port: process.env.MYSQLPORT || 3306,
  // Настройка SSL: включаем только если мы НЕ на локалхосте
  ssl: (process.env.MYSQLHOST && process.env.MYSQLHOST !== 'localhost') ? {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  } : null 
};
// Создаем функцию, которой не хватало
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// Функции для взаимодействия с базой данных


// Маршрут для обработки запросов на вход кандидата
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Пожалуйста, введите email и пароль.');
    return res.redirect('/auth/login');
  }

  let connection;
  try {
    connection = await getConnection();
    const candidate = await db.getCandidateByEmail(email);

    if (!candidate) {
      req.flash('error', 'Неверный email или пароль.');
      return res.redirect('/auth/login');
    }

    // В базе данных столбец с хешированным паролем называется 'password_hash'
    const isMatch = await bcrypt.compare(password, candidate.password_hash);

    if (!isMatch) {
      req.flash('error', 'Неверный email или пароль.');
      return res.redirect('/auth/login');
    }

    // Успешная аутентификация: Устанавливаем сессию
    req.session.candidateId = candidate.id;
    req.session.isAuthenticated = true; // Используйте это для проверки аутентификации
// --- ДОБАВЬТЕ ЭТИ СТРОКИ ДЛЯ ЛОГИРОВАНИЯ ---
    console.log('Сессия после успешного входа:', req.session);
    console.log('Candidate ID в сессии:', req.session.candidateId);
    console.log('isAuthenticated в сессии:', req.session.isAuthenticated);
    // --- КОНЕЦ ЛОГИРОВАНИЯ ---


    req.flash('success', 'Login successful!');
    res.redirect(`/candidates/profile/${candidate.id}`); // Перенаправляем на страницу профиля кандидата
  } catch (error) {
    console.error('Error processing candidate login:', error);
    req.flash('error', 'An error occurred on the server. Please try again later.');
    res.redirect('/auth/login');
  } finally {
    if (connection) connection.end();
  }
});

// Добавляем маршрут для главной страницы кандидатов, которая требует аутентификации
// Например, это может быть дашборд кандидата
app.get('/candidates/dashboard', isAuthenticated, (req, res) => {
  res.render('candidates/dashboard', {
    title: 'Candidate Dashboard',
    message: `Welcome, Candidate with ID: ${req.session.candidateId}!`
  });
});
app.get('/candidates/register', (req, res) => {
    if (req.isAuthenticated()) { 
              res.render('candidates/register', { candidateData: req.user });
    
  
} else {
        // Если не авторизован, отображаем пустую форму регистрации
        res.render('candidates/register', { candidateData: null });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
