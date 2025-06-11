const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'talent_query_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Set view engine
app.set('view engine', 'ejs');
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layout'); // layout.ejs


app.set('views', path.join(__dirname, 'views'));

// --- Начало определения роутов ---

// Роут для главной страницы (Home)
app.get('/', (req, res) => {
    res.render('index', { // 'home' - это название вашего EJS файла для главной страницы (например, home.ejs в папке views)
        title: 'TalentQuery - Home', // Значение для <%= title %> в layout.ejs
        page: 'home' // Значение для динамического выделения активной ссылки в навигации
    });
});

// Роут для страницы "For Candidates"
app.get('/candidates', (req, res) => {
    res.render('candidates-landing', { // Предполагается, что у вас есть views/candidates.ejs
        title: 'TalentQuery - For Candidates',
        page: 'candidates'
    });
});

// Роут для страницы "For Employers"
app.get('/employers', (req, res) => {
    res.render('employers-landing', { // Предполагается, что у вас есть views/employers.ejs
        title: 'TalentQuery - For Employers',
        page: 'employers'
    });
});


// Роут для страницы "Contact"
app.get('/contact', (req, res) => {
    res.render('contact', { // Предполагается, что у вас есть views/contact.ejs
        title: 'TalentQuery - Contact Us',
        page: 'contact'
    });
});




// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'talent_query_db'
});

// Connect to database
db.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  
    
    // Create tables
    const createTables = () => {
      // Blog posts table
      const createBlogTable = `
        CREATE TABLE IF NOT EXISTS blog_posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          summary TEXT,
          content TEXT NOT NULL,
          image_path VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      
      // Job posts table
      const createJobsTable = `
        CREATE TABLE IF NOT EXISTS job_posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          description TEXT NOT NULL,
          requirements TEXT,
          salary_range VARCHAR(100),
          job_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      
      // Candidates table
      const createCandidatesTable = `
        CREATE TABLE IF NOT EXISTS candidates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          photo_path VARCHAR(255),
          cv_path VARCHAR(255),
          expected_salary VARCHAR(100),
          skills TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      
      // Applications table (relation between candidates and jobs)
      const createApplicationsTable = `
        CREATE TABLE IF NOT EXISTS applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          candidate_id INT,
          job_id INT,
          status VARCHAR(50) DEFAULT 'pending',
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (candidate_id) REFERENCES candidates(id),
          FOREIGN KEY (job_id) REFERENCES job_posts(id)
        )
      `;
      
      // Execute queries
      db.query(createBlogTable, (err) => {
        if (err) console.error('Error creating blog table:', err);
        else console.log('Blog table created or already exists');
      });
      
      db.query(createJobsTable, (err) => {
        if (err) console.error('Error creating jobs table:', err);
        else console.log('Jobs table created or already exists');
      });
      
      db.query(createCandidatesTable, (err) => {
        if (err) console.error('Error creating candidates table:', err);
        else console.log('Candidates table created or already exists');
      });
      
      db.query(createApplicationsTable, (err) => {
        if (err) console.error('Error creating applications table:', err);
        else console.log('Applications table created or already exists');
      });
    };
    
    createTables();
  });
;

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === 'blog_image') {
      uploadPath = path.join(__dirname, 'public/uploads/blog');
    } else if (file.fieldname === 'candidate_photo') {
      uploadPath = path.join(__dirname, 'public/uploads/photos');
    } else if (file.fieldname === 'candidate_cv') {
      uploadPath = path.join(__dirname, 'public/uploads/cvs');
    } else {
      uploadPath = path.join(__dirname, 'public/uploads/misc');
    }
    
    // Create directory if it doesn't exist
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });
app.use(express.static(path.join(__dirname,'../public')));
// Routes
// Import routes
const indexRoutes = require('./routes/index');
const blogRoutes = require('./routes/blog');
const jobsRoutes = require('./routes/jobs');
const candidatesRoutes = require('./routes/candidates');

// Use routes
app.use('/', indexRoutes);
app.use('/blog', blogRoutes);
app.use('/jobs', jobsRoutes);
app.use('/candidates', candidatesRoutes);




// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found', 
  page:''
  
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
