// src/middleware/employerAdminAuth.js

/**
 * Мидлвар для проверки, что пользователь авторизован как работодатель или администратор.
 * Он предполагает, что информация о пользователе хранится в req.session.employerUser
 * после успешного входа.
 */
const isAuthenticatedEmployerAdmin = (req, res, next) => {
    // Проверяем, существует ли сессия и есть ли в ней данные employerUser
    if (req.session && req.session.employerUser) {
        // Если да, прикрепляем данные пользователя к объекту запроса для дальнейшего использования
        req.employerUser = req.session.employerUser;
        return next(); // Пользователь авторизован, продолжаем выполнение следующего мидлвара или обработчика маршрута
    } else {
        // Если нет, пользователь не авторизован.
        // Перенаправляем его на страницу входа с сообщением об ошибке.
         req.session.redirectTo = req.originalUrl;
        // req.originalUrl сохраняет URL, куда пользователь пытался попасть,
        // чтобы после входа можно было перенаправить его обратно.
       return res.redirect(`/employer-admin/login`); // Перенаправляем просто на страницу логина
    }
};

/**
 * Мидлвар для проверки роли пользователя (только для работодателей или администраторов).
 * Этот мидлвар должен идти после isAuthenticatedEmployerAdmin, так как он полагается на req.employerUser.
 */
const authorizeEmployerOrAdmin = (req, res, next) => {
    // Проверяем, что req.employerUser существует (т.е. isAuthenticatedEmployerAdmin уже сработал)
    if (!req.employerUser) {
        // Это не должно произойти, если isAuthenticatedEmployerAdmin работает правильно,
        // но это хорошая защита.
        return res.status(403).render('error', {
            title: 'Access Denied',
            message: 'Authorization Error. Failed to retrieve user data.'
        });
    }

    const userRole = req.employerUser.role; // Предполагаем, что у вас есть поле 'role' в таблице employer_users

    // Проверяем, является ли пользователь работодателем или администратором
    if (userRole === 'employer' || userRole === 'admin') {
        return next(); // Пользователь имеет нужную роль, продолжаем
    } else {
        // Если роль не соответствует, отказываем в доступе
        return res.status(403).render('error', {
            title: 'Access Denied',
            message: 'You do not have permission to perform this action.'
        });
    }
};

// Экспортируем функции, чтобы их можно было использовать в других файлах
module.exports = {
    isAuthenticatedEmployerAdmin,
    authorizeEmployerOrAdmin
};