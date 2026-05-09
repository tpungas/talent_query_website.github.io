const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');



// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    // Проверяем, существует ли сессия и установлен ли candidateId (для кандидатов)
    // или user (для обычных пользователей/админов)
    if (req.session && (req.session.candidateId || req.session.user)) {
        return next(); // Пользователь аутентифицирован, продолжаем
    }
    // Пользователь не аутентифицирован
    req.flash('error', 'Вы должны быть авторизованы для доступа к этой странице.');
    res.redirect('/auth/login'); // Перенаправляем на страницу входа
}

// --- Auth Routes ---

// GET /auth/register - Show registration form
router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register - Talent Query', page: 'register', errors: req.flash('error'), formData: {} });
});

// POST /auth/register - Handle user registration
// Этот маршрут предназначен для ОБЩЕЙ регистрации пользователей (админов, работодателей),
// а регистрация кандидатов обрабатывается в `routes/candidates.js`
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        req.flash('error', 'Please fill in all fields.');
        return res.redirect('/auth/register');
    }

    try {
        db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, results) => {
            if (err) {
                console.error('Error checking user existence:', err);
                req.flash('error', 'Database error during registration.');
                return res.redirect('/auth/register');
            }
            if (results.length > 0) {
                req.flash('error', 'Username or Email already exists.');
                return res.redirect('/auth/register');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, role], (err, result) => {
                    if (err) {
                        console.error('Error inserting new user:', err);
                        req.flash('error', 'Failed to register user.');
                        return res.redirect('/auth/register');
                    }
                    req.flash('success', 'Registration successful! Please login.');
                    res.redirect('/auth/login');
                });
        });
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error', 'An unexpected error occurred while registering.');
        res.redirect('/auth/register');
    }
});

// GET /auth/login - Show login form
router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Login - Talent Query',
        page: 'login',
        errors: req.flash('error'), // Передаем сообщения об ошибках
        messages: req.flash('success') // Передаем сообщения об успехе
    });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        global.db.query('SELECT * FROM test.candidates WHERE email = ?', [email], async (err, results) => {
            // СЛУЧАЙ 1: Ошибка БД или пользователь не найден
            if (err || results.length === 0) {
                return res.render('auth/login', { 
                    title: 'Login - Talent Query',
                    page: 'login',
                    errors: ['Пользователь с таким Email не найден'], // Передаем текст ошибки
                    formData: { email: email } // Возвращаем email в поле, чтобы он не исчез!
                });
            

            const candidate = results[0];
            const isMatch = await bcrypt.compare(password, candidate.password_hash);

            // СЛУЧАЙ 2: Пароль не подошел
            if (!isMatch) {
                return res.render('auth/login', { 
                    title: 'Login - Talent Query',
                    page: 'login',
                    errors: ['Неверный пароль. Попробуйте еще раз.'],
                    formData: { email: email } // Email остается на месте!
                });
      // Успех! Сохраняем в сессию
            req.session.candidateId = candidate.id;
            req.session.isAuthenticated = true;
            
            req.flash('success', 'Вы успешно вошли!');
            res.redirect(`/candidates/profile/${candidate.id}`);
        }); // Это закрывает db.query
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'Произошла ошибка на сервере.');
        res.redirect('/auth/login');
    }
}); // Это закрывает router.post

// GET /auth/logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Could not log out.');
        res.redirect('/');
    });
});

module.exports = { router: router, isAuthenticated: isAuthenticated };    Authenticated

