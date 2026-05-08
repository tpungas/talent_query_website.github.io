const express = require('express');
const router = express.Router();
const mysql = require('mysql2');



// Обработка формы
router.post('/contact/submit', (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).send('Please fill in all required fields.');
  }

  pool.execute(
    `INSERT INTO contact_messages (name, email, phone, subject, message)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, phone || null, subject, message],
    (err) => {
      if (err) {
        console.error('Error saving message:', err);
        return res.status(500).send('Error sending.');
      }

      // Показываем alert и возвращаемся на /contact
      res.send(`
        <script>
          alert("Message sent!");
          window.location.href = "/contact";
        </script>
      `);
    }
  );
});

module.exports = router;
