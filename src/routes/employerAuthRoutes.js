const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const mysql = require('mysql2'); 



// GET: Форма логина
router.get('/employer-admin/login', (req, res) => {
    res.render('employer-admin/login', {
        title: 'Employer/Administrator Login',
        error: req.query.error || null
    });
});

// POST: Обработка входа
router.post('/employer-admin/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).render('employer-admin/login', {
            title: 'Employer/Administrator Login',
            error: 'Please enter your email and password.'
        });
    }

    db.query('SELECT * FROM employer_users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('User request error:', err);
            return res.status(500).render('employer-admin/login', {
                title: 'Employer/Administrator Login',
                error: 'A server error occurred.'
            });
        }

        const user = results[0];

        // Проверка пользователя и пароля (используем password_hash как в Admin Password.docx)
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).render('employer-admin/login', {
                title: 'Employer/Administrator Login',
                error: 'Incorrect email address or password.'
            });
        }

        // --- УСПЕШНЫЙ ВХОД: СОХРАНЯЕМ В СЕССИЮ ---
        // Мы сохраняем объект целиком. Пока сессия жива (в куках браузера), 
        // пользователь будет считаться авторизованным.
        req.session.employerUser = {
            id: user.id,
            email: user.email,
            role: user.role // Здесь будет 'admin' или 'employer' из БД
        };
router.get('/employer-admin/dashboard', (req, res) => {
    if (!req.session.employerUser) return res.redirect('/employer-admin/login');

    const user = req.session.employerUser;
    let sql = '';
    let params = [];

    if (user.role === 'admin') {
        // Админ видит всё
        sql = 'SELECT * FROM job_posts ORDER BY created_at DESC';
    } else {
        // Наниматель видит только своё
        sql = 'SELECT * FROM job_posts WHERE employer_id = ? ORDER BY created_at DESC';
        params.push(user.id);
    }

    db.query(sql, params, (err, jobs) => {
        if (err) return res.status(500).send(err.message);
        res.render('employer-admin/dashboard', {
            title: 'Dashboard',
            user: user,
            jobs: jobs
        });
    });
});
router.get('/admin/add-employer', (req, res) => {
    if (!req.session.employerUser || req.session.employerUser.role !== 'admin') {
        return res.status(403).send('Access Denied');
    }
    res.render('employer-admin/add-employer', {
        title: 'Add New Employer',
        user: req.session.employerUser
    });
});
router.get('/employer-admin/change-password', (req, res) => {
    if (!req.session.employerUser) return res.redirect('/employer-admin/login');
    
    res.render('employer-admin/change-password', {
        title: 'Change Password',
        user: req.session.employerUser
    });
});

router.get('/jobs/:id/candidates', async (req, res) => {
    // 1. Проверяем авторизацию
    if (!req.session.employerUser) {
        return res.redirect('/employer-admin/login');
    }

    const jobId = req.params.id;
    const user = req.session.employerUser;

    try {
        // 2. Получаем список кандидатов, подавших заявку на эту работу
        // ВАЖНО: Проверьте названия таблиц (job_applications, candidates)
        const [candidates] = await db.promise().query(
            `SELECT c.id, c.name, c.email, c.skills, ja.applied_at 
             FROM candidates c
             JOIN applications ja ON c.id = ja.candidate_id
             WHERE ja.job_id = ?`, 
            [jobId]
        );

        // 3. Рендерим страницу со списком
        res.render('employer-admin/job-candidates', {
            title: 'Job Applicants',
            candidates: candidates,
            jobId: jobId,
            user: user
        });
    } catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Server Error');
    }
});

        // Логика перенаправления:
        // 1. Если админ шел по конкретной ссылке (redirectTo) - отправляем туда.
        // 2. Если просто зашел "с улицы" - отправляем в общую панель управления (dashboard).
        let redirectToPath = req.session.redirectTo || '/employer-admin/dashboard'; 
        
        delete req.session.redirectTo; 

        res.redirect(redirectToPath); 
    });
});

// GET: Выход из системы
router.get('/employer-admin/logout', (req, res) => {
    // Полностью уничтожаем сессию на сервере
    req.session.destroy(err => {
        if (err) {
            console.error('Error terminating session:', err);
            return res.status(500).send('Error logging out.');
        }
        // Очищаем куку в браузере (важно для "забывания" пользователя)
        res.clearCookie('connect.sid'); 
        res.redirect('/employer-admin/login'); 
    });
});

router.post('/admin/add-employer', async (req, res) => {
    const { email, password, role, username, company_name } = req.body;
    try {
        const hashedPassword = await require('bcrypt').hash(password, 10);
        const query = `
            INSERT INTO employer_users (username, email, password_hash, role, company_name) 
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(query, [username || email, email, hashedPassword, role, company_name], (err, result) => {
            if (err) return res.status(500).send(err.message);
            res.redirect('/employer-admin/dashboard');
        });
    } catch (e) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;