const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Middleware для проверки аутентификации
function isAuthenticated(req, res, next) {
    if (req.session && (req.session.candidateId || req.session.user)) {
        return next();
    }
    req.flash('error', 'Вы должны быть авторизованы для доступа к этой странице.');
    res.redirect('/auth/login');
}

// --- Маршруты регистрации ---

router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register - Talent Query', page: 'register', errors: req.flash('error'), formData: {} });
});

router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
        req.flash('error', 'Please fill in all fields.');
        return res.redirect('/auth/register');
    }

    try {
        global.db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, results) => {
            if (err) {
                req.flash('error', 'Database error.');
                return res.redirect('/auth/register');
            }
            if (results.length > 0) {
                req.flash('error', 'Username or Email already exists.');
                return res.redirect('/auth/register');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            global.db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, role], (err) => {
                    if (err) {
                        req.flash('error', 'Failed to register.');
                        return res.redirect('/auth/register');
                    }
                    req.flash('success', 'Registration successful! Please login.');
                    res.redirect('/auth/login');
                });
        });
    } catch (error) {
        res.redirect('/auth/register');
    }
});

// --- Маршруты входа ---

router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Login - Talent Query',
        page: 'login',
        errors: req.flash('error'),
        messages: req.flash('success')
    });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        global.db.query('SELECT * FROM test.candidates WHERE email = ?', [email], async (err, results) => {
            if (err || results.length === 0) {
                return res.render('auth/login', { 
                    title: 'Login - Talent Query',
                    page: 'login',
                    errors: ['Пользователь с таким Email не найден'],
                    formData: { email: email }
                });
            }

            const candidate = results[0];
            const isMatch = await bcrypt.compare(password, candidate.password_hash || candidate.password);

            if (!isMatch) {
                return res.render('auth/login', { 
                    title: 'Login - Talent Query',
                    page: 'login',
                    errors: ['Неверный пароль. Попробуйте еще раз.'],
                    formData: { email: email }
                });
            }

            req.session.candidateId = candidate.id;
            req.session.isAuthenticated = true;
            res.redirect(`/candidates/profile/${candidate.id}`);
        }); 
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/auth/login');
    }
});

// --- Выход ---

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Could not log out.');
        res.redirect('/');
    });
});

// Экспорт (строго один раз в конце файла)
module.exports = {
    router: router,
    isAuthenticated: isAuthenticated
};
