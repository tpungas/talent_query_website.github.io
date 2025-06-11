// Blog routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');

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
    const uploadPath = path.join(__dirname, '../../public/uploads/blog');
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
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Get all blog posts
router.get('/', (req, res) => {
  const query = 'SELECT * FROM blog_posts ORDER BY created_at DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching blog posts:', err);
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Failed to fetch blog posts'
      });
    }
    
    res.render('blog/index', { 
      title: 'Blog - Talent Query',
      page: 'blog',
      posts: results
    });
  });
});

// Get blog post creation form
router.get('/new', (req, res) => {
  res.render('blog/new', { 
    title: 'Create New Blog Post - Talent Query',
    page: 'blog'
  });
});

// Create new blog post
router.post('/new', upload.single('blog_image'), (req, res) => {
  const { title, summary, content } = req.body;
  const imagePath = req.file ? `/uploads/blog/${req.file.filename}` : null;
  
  const query = 'INSERT INTO blog_posts (title, summary, content, image_path) VALUES (?, ?, ?, ?)';
  
  db.query(query, [title, summary, content, imagePath], (err, result) => {
    if (err) {
      console.error('Error creating blog post:', err);
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Failed to create blog post'
      });
    }
    
    res.redirect('/blog');
  });
});

// Get single blog post
router.get('/:id', (req, res) => {
  const query = 'SELECT * FROM blog_posts WHERE id = ?';
  
  db.query(query, [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      console.error('Error fetching blog post:', err);
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Blog post not found'
      });
    }
    
    res.render('blog/show', { 
      title: `${results[0].title} - Talent Query Blog`,
      page: 'blog',
      post: results[0]
    });
  });
});

// Get blog post edit form
router.get('/:id/edit', (req, res) => {
  const query = 'SELECT * FROM blog_posts WHERE id = ?';
  
  db.query(query, [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      console.error('Error fetching blog post for edit:', err);
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Blog post not found'
      });
    }
    
    res.render('blog/edit', { 
      title: `Edit: ${results[0].title} - Talent Query Blog`,
      page: 'blog',
      post: results[0]
    });
  });
});

// Update blog post
router.post('/:id/edit', upload.single('blog_image'), (req, res) => {
  const { title, summary, content } = req.body;
  let query, params;
  
  if (req.file) {
    // If a new image is uploaded
    const imagePath = `/uploads/blog/${req.file.filename}`;
    query = 'UPDATE blog_posts SET title = ?, summary = ?, content = ?, image_path = ? WHERE id = ?';
    params = [title, summary, content, imagePath, req.params.id];
    
    // Delete old image if exists
    db.query('SELECT image_path FROM blog_posts WHERE id = ?', [req.params.id], (err, results) => {
      if (!err && results.length > 0 && results[0].image_path) {
        const oldImagePath = path.join(__dirname, '../../public', results[0].image_path);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Error deleting old image:', err);
        });
      }
    });
  } else {
    // If no new image is uploaded
    query = 'UPDATE blog_posts SET title = ?, summary = ?, content = ? WHERE id = ?';
    params = [title, summary, content, req.params.id];
  }
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error updating blog post:', err);
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Failed to update blog post'
      });
    }
    
    res.redirect(`/blog/${req.params.id}`);
  });
});

// Delete blog post
router.post('/:id/delete', (req, res) => {
  // First get the image path to delete the file
  db.query('SELECT image_path FROM blog_posts WHERE id = ?', [req.params.id], (err, results) => {
    if (!err && results.length > 0 && results[0].image_path) {
      const imagePath = path.join(__dirname, '../../public', results[0].image_path);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting image:', err);
      });
    }
    
    // Then delete the post from database
    const query = 'DELETE FROM blog_posts WHERE id = ?';
    
    db.query(query, [req.params.id], (err, result) => {
      if (err) {
        console.error('Error deleting blog post:', err);
        return res.status(500).render('error', { 
          title: 'Error',
          message: 'Failed to delete blog post'
        });
      }
      
      res.redirect('/blog');
    });
  });
});

module.exports = router;
