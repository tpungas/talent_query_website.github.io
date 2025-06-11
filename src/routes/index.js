// Environment variables
require('dotenv').config();

// Routes for the main landing pages
const express = require('express');
const router = express.Router();

// Home page route
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Talent Query - IT Recruitment Agency',
    page: 'home'
  });
});

// Candidates landing page
router.get('/candidates', (req, res) => {
  res.render('candidates-landing', { 
    title: 'For Candidates - Talent Query',
    page: 'candidates'
  });
});

// Employers landing page
router.get('/employers', (req, res) => {
  res.render('employers-landing', { 
    title: 'For Employers - Talent Query',
    page: 'employers'
  });
});

// About us page
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About Us - Talent Query',
    page: 'about'
  });
});

// Services page
router.get('/services', (req, res) => {
  res.render('services', { 
    title: 'Our Services - Talent Query',
    page: 'services'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contact Us - Talent Query',
    page: 'contact'
  });
});

module.exports = router;
