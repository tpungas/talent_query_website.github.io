// Jobs routes
const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'talent_query_db'
});

// Get all job posts
router.get('/', (req, res) => {
  const query = 'SELECT * FROM job_posts ORDER BY created_at DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching job posts:', err);
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Failed to fetch job posts'
      });
    }
    
    res.render('jobs/index', { 
      title: 'Job Opportunities - Talent Query',
      page: 'jobs',
      jobs: results
    });
  });
});

// Get job post creation form
router.get('/new', (req, res) => {
  res.render('jobs/new', { 
    title: 'Create New Job Post - Talent Query',
    page: 'jobs'
  });
});

// Create new job post
router.post('/new', (req, res) => {
  const { title, company, location, description, requirements, salary_range, job_type } = req.body;
  
  const query = 'INSERT INTO job_posts (title, company, location, description, requirements, salary_range, job_type) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  db.query(query, [title, company, location, description, requirements, salary_range, job_type], (err, result) => {
    if (err) {
      console.error('Error creating job post:', err);
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Failed to create job post'
      });
    }
    
    res.redirect('/jobs');
  });
});

// Get single job post
router.get('/:id', (req, res) => {
  const query = 'SELECT * FROM job_posts WHERE id = ?';
  
  db.query(query, [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      console.error('Error fetching job post:', err);
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Job post not found'
      });
    }
    
    res.render('jobs/show', { 
      title: `${results[0].title} - Talent Query Jobs`,
      page: 'jobs',
      job: results[0]
    });
  });
});

// Get job post edit form
router.get('/:id/edit', (req, res) => {
  const query = 'SELECT * FROM job_posts WHERE id = ?';
  
  db.query(query, [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      console.error('Error fetching job post for edit:', err);
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Job post not found'
      });
    }
    
    res.render('jobs/edit', { 
      title: `Edit: ${results[0].title} - Talent Query Jobs`,
      page: 'jobs',
      job: results[0]
    });
  });
});

// Update job post
router.post('/:id/edit', (req, res) => {
  const { title, company, location, description, requirements, salary_range, job_type } = req.body;
  
  const query = 'UPDATE job_posts SET title = ?, company = ?, location = ?, description = ?, requirements = ?, salary_range = ?, job_type = ? WHERE id = ?';
  
  db.query(query, [title, company, location, description, requirements, salary_range, job_type, req.params.id], (err, result) => {
    if (err) {
      console.error('Error updating job post:', err);
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Failed to update job post'
      });
    }
    
    res.redirect(`/jobs/${req.params.id}`);
  });
});

// Delete job post
router.post('/:id/delete', (req, res) => {
  const query = 'DELETE FROM job_posts WHERE id = ?';
  
  db.query(query, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting job post:', err);
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Failed to delete job post'
      });
    }
    
    res.redirect('/jobs');
  });
});

// Apply for a job
router.post('/:id/apply', (req, res) => {
  const jobId = req.params.id;
  const candidateId = req.body.candidate_id;
  
  // Check if application already exists
  const checkQuery = 'SELECT * FROM applications WHERE candidate_id = ? AND job_id = ?';
  
  db.query(checkQuery, [candidateId, jobId], (err, results) => {
    if (err) {
      console.error('Error checking application:', err);
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Failed to process application'
      });
    }
    
    if (results.length > 0) {
      return res.status(400).render('error', { 
        title: 'Error',
        message: 'You have already applied for this job'
      });
    }
    
    // Create new application
    const insertQuery = 'INSERT INTO applications (candidate_id, job_id) VALUES (?, ?)';
    
    db.query(insertQuery, [candidateId, jobId], (err, result) => {
      if (err) {
        console.error('Error creating application:', err);
        return res.status(500).render('error', { 
          title: 'Error',
          message: 'Failed to submit application'
        });
      }
      
      res.redirect(`/jobs/${jobId}/success`);
    });
  });
});

// Application success page
router.get('/:id/success', (req, res) => {
  res.render('jobs/success', { 
    title: 'Application Submitted - Talent Query',
    page: 'jobs',
    jobId: req.params.id
  });
});

module.exports = router;
