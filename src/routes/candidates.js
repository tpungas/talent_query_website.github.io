// Candidates routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');
const bcrypt = require('bcryptjs');
// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'talent_query_db'
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === 'candidate_photo') {
      uploadPath = path.join(__dirname, '../../public/uploads/photos');
    } else if (file.fieldname === 'candidate_cv') {
      uploadPath = path.join(__dirname, '../../public/uploads/cvs');
    } else {
      uploadPath = path.join(__dirname, '../../public/uploads/misc');
    }
    
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'candidate_photo') {
      const filetypes = /jpeg|jpg|png|gif/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Only image files are allowed for photos!'));
    } else if (file.fieldname === 'candidate_cv') {
      const filetypes = /pdf|doc|docx/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      
      if (extname) {
        return cb(null, true);
      }
      cb(new Error('Only PDF, DOC, or DOCX files are allowed for CVs!'));
    } else {
      cb(null, true);
    }
  }
});

// Get candidate registration form
router.get('/register', (req, res) => {
  res.render('candidates/register', { 
    title: 'Register as a Candidate - Talent Query',
    page: 'candidates'
  });
});

// Create new candidate
router.post('/register', upload.fields([
  { name: 'candidate_photo', maxCount: 1 },
  { name: 'candidate_cv', maxCount: 1 }
]),async (req, res) => {

 console.log(req.body); // <-- Вставьте эту строку ЗДЕСЬ
    console.log(req.files); // <-- И, возможно, эту тоже, чтобы увидеть загруженные файлы


  const { fullName, email, password, confirmPassword, expectedSalary, skills } = req.body;
      // Проверка совпадения паролей (опционально, но рекомендуется)
    if (password !== confirmPassword) {
        console.error('Error registering candidate: Passwords do not match');
        return res.status(400).render('error', {
            title: 'Error',
            message: 'Passwords do not match. Please try again.'
        });
    }

    // Хеширование пароля перед сохранением
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 10); // 10 - это saltRounds, рекомендуемое значение
    } catch (hashError) {
        console.error('Error hashing password:', hashError);
        return res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to process password.'
        });
    }


      const photoPath = req.files && req.files['candidate_photo'] && req.files['candidate_photo'][0] ?
        `/uploads/photos/${req.files['candidate_photo'][0].filename}` : null;

    const cvPath = req.files && req.files['candidate_cv'] && req.files['candidate_cv'][0] ?
        `/uploads/cvs/${req.files['candidate_cv'][0].filename}` : null;

  const query = 'INSERT INTO candidates (full_name, email, password_hash, photo_path, cv_path, expected_salary, skills) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  db.query(query, [fullName, email, hashedPassword, photoPath, cvPath, expectedSalary, skills], (err, result) => {
    if (err) {
      console.error('Error registering candidate:', err);
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Failed to register candidate'
      });
    }
    
    res.redirect(`/candidates/profile/${result.insertId}`);
  });
});

// Get candidate profile
router.get('/profile/:id', (req, res) => {
  const candidateQuery = 'SELECT * FROM candidates WHERE id = ?';
  
  db.query(candidateQuery, [req.params.id], (err, candidateResults) => {
    if (err || candidateResults.length === 0) {
      console.error('Error fetching candidate profile:', err);
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Candidate profile not found'
      });
    }
    
    // Get applications for this candidate
    const applicationsQuery = `
      SELECT a.*, j.title, j.company 
      FROM applications a 
      JOIN job_posts j ON a.job_id = j.id 
      WHERE a.candidate_id = ?
    `;
    
    db.query(applicationsQuery, [req.params.id], (err, applicationResults) => {
      if (err) {
        console.error('Error fetching candidate applications:', err);
        applicationResults = [];
      }
      
      res.render('candidates/profile', { 
        title: `${candidateResults[0].fullName} - Talent Query`,
        page: 'candidates',
        candidate: candidateResults[0],
        applications: applicationResults
      });
    });
  });
});

// Get candidate edit form
router.get('/profile/:id/edit', (req, res) => {
  const query = 'SELECT * FROM candidates WHERE id = ?';
  
  db.query(query, [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      console.error('Error fetching candidate for edit:', err);
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Candidate profile not found'
      });
    }
    
    res.render('candidates/edit', { 
      title: `Edit Profile: ${results[0].fullName} - Talent Query`,
      page: 'candidates',
      candidate: results[0]
    });
  });
});

// Update candidate profile
router.post('/profile/:id/edit', upload.fields([
  { name: 'candidate_photo', maxCount: 1 },
  { name: 'candidate_cv', maxCount: 1 }
]), (req, res) => {
  const { fullName, email, expectedSalary, skills } = req.body;
  let query, params;
  
  // Check if files were uploaded
  const photoUploaded = req.files['candidate_photo'] && req.files['candidate_photo'].length > 0;
  const cvUploaded = req.files['candidate_cv'] && req.files['candidate_cv'].length > 0;
  
  // Get current candidate data to handle file updates
  db.query('SELECT photo_path, cv_path FROM candidates WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      console.error('Error fetching candidate data for update:', err);
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Candidate profile not found'
      });
    }
    
    const currentData = results[0];
    
    // Handle photo update
    let photoPath = currentData.photo_path;
    if (photoUploaded) {
      photoPath = `/uploads/photos/${req.files['candidate_photo'][0].filename}`;
      
      // Delete old photo if exists
      if (currentData.photo_path) {
        const oldPhotoPath = path.join(__dirname, '../../public', currentData.photo_path);
        fs.unlink(oldPhotoPath, (err) => {
          if (err) console.error('Error deleting old photo:', err);
        });
      }
    }
    
    // Handle CV update
    let cvPath = currentData.cv_path;
    if (cvUploaded) {
      cvPath = `/uploads/cvs/${req.files['candidate_cv'][0].filename}`;
      
      // Delete old CV if exists
      if (currentData.cv_path) {
        const oldCvPath = path.join(__dirname, '../../public', currentData.cv_path);
        fs.unlink(oldCvPath, (err) => {
          if (err) console.error('Error deleting old CV:', err);
        });
      }
    }
    
    // Update candidate data
    query = 'UPDATE candidates SET fullName = ?, email = ?, photo_path = ?, cv_path = ?, expectedSalary = ?, skills = ? WHERE id = ?';
    params = [fullName, email, photoPath, cvPath, expectedSalary, skills, req.params.id];
    
    db.query(query, params, (err, result) => {
      if (err) {
        console.error('Error updating candidate profile:', err);
        return res.status(500).render('error', { 
          title: 'Error',
          message: 'Failed to update candidate profile'
        });
      }
      
      res.redirect(`/candidates/profile/${req.params.id}`);
    });
  });
});

// Delete candidate profile
router.post('/profile/:id/delete', (req, res) => {
  // First get the file paths to delete the files
  db.query('SELECT photo_path, cv_path FROM candidates WHERE id = ?', [req.params.id], (err, results) => {
    if (!err && results.length > 0) {
      const candidate = results[0];
      
      // Delete photo if exists
      if (candidate.photo_path) {
        const photoPath = path.join(__dirname, '../../public', candidate.photo_path);
        fs.unlink(photoPath, (err) => {
          if (err) console.error('Error deleting photo:', err);
        });
      }
      
      // Delete CV if exists
      if (candidate.cv_path) {
        const cvPath = path.join(__dirname, '../../public', candidate.cv_path);
        fs.unlink(cvPath, (err) => {
          if (err) console.error('Error deleting CV:', err);
        });
      }
    }
    
    // Delete applications first (foreign key constraint)
    db.query('DELETE FROM applications WHERE candidate_id = ?', [req.params.id], (err) => {
      if (err) {
        console.error('Error deleting candidate applications:', err);
      }
      
      // Then delete the candidate from database
      const query = 'DELETE FROM candidates WHERE id = ?';
      
      db.query(query, [req.params.id], (err, result) => {
        if (err) {
          console.error('Error deleting candidate profile:', err);
          return res.status(500).render('error', { 
            title: 'Error',
            message: 'Failed to delete candidate profile'
          });
        }
        
        res.redirect('/candidates');
      });
    });
  });
});

// Browse available jobs
router.get('/jobs', (req, res) => {
  const query = 'SELECT * FROM job_posts ORDER BY created_at DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching jobs for candidates:', err);
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Failed to fetch available jobs'
      });
    }
    
    res.render('candidates/jobs', { 
      title: 'Available Jobs - Talent Query',
      page: 'candidates',
      jobs: results
    });
  });
});

module.exports = router;
