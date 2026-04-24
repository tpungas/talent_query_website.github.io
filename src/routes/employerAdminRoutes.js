const express = require('express');
const router = express.Router();
// Импортируем вашего "пограничника"
const { isAuthenticatedEmployerAdmin, authorizeEmployerOrAdmin } = require('../middleware/employerAdminAuth');

// 1. Личный кабинет (Dashboard)
// Сначала проверяем, залогинен ли (isAuthenticated), потом пускаем
router.get('/employer-admin/dashboard', isAuthenticatedEmployerAdmin, (req, res) => {
    res.render('employer-admin/dashboard', {
        title: 'Admin Dashboard',
        user: req.employerUser // Данные попали сюда из мидлвара!
    });
});

// 2. Пример роута только для АДМИНА (например, список всех нанимателей)
router.get('/employer-admin/manage-employers', isAuthenticatedEmployerAdmin, (req, res, next) => {
    if (req.employerUser.role !== 'admin') {
        return res.status(403).send('Только для главного администратора');
    }
    next();
}, (req, res) => {
    res.render('employer-admin/employers-list');
});

module.exports = router;