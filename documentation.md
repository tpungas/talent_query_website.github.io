# Talent Query Website Documentation

## Overview
This document provides an overview of the Talent Query recruitment agency website, including its structure, features, and how to customize it.

## Project Structure

```
talent_query_website/
├── src/
│   ├── app.js                 # Main application file
│   ├── controllers/           # Controller logic
│   ├── models/                # Database models
│   ├── routes/                # Route definitions
│   │   ├── index.js           # Main routes
│   │   ├── blog.js            # Blog routes
│   │   ├── jobs.js            # Jobs routes
│   │   └── candidates.js      # Candidates routes
│   ├── views/                 # EJS templates
│   │   ├── layout.ejs         # Main layout template
│   │   ├── index.ejs          # Homepage template
│   │   ├── blog/              # Blog templates
│   │   ├── jobs/              # Jobs templates
│   │   └── candidates/        # Candidates templates
│   └── public/                # Static assets
│       ├── css/               # CSS files
│       │   └── main.scss      # Main SASS file with customizable palette
│       ├── js/                # JavaScript files
│       │   └── main.js        # Main JavaScript file
│       └── uploads/           # Uploaded files
│           ├── blog/          # Blog images
│           ├── photos/        # Candidate photos
│           └── cvs/           # Candidate CVs
└── package.json               # Project dependencies
```

## Features

### Landing Pages
- Homepage with sections for all main services
- Dedicated landing page for candidates
- Dedicated landing page for employers/clients

### Blog System
- Create new blog posts with title, summary, content, and image
- View all blog posts with pagination
- Edit existing blog posts
- Delete blog posts

### Job Posts System
- Post new job positions with detailed information
- Browse available jobs
- Job application system
- Database for tracking applications

### Candidate Management
- Candidate registration with profile creation
- CV upload functionality
- Profile management (edit, update, delete)
- Application tracking

## Technology Stack
- **Frontend**: HTML, SASS, JavaScript
- **Backend**: Node.js with Express
- **Database**: MySQL
- **Template Engine**: EJS
- **File Upload**: Multer

## Customization

### Color Palette
The website uses a customizable color palette defined in `src/public/css/main.scss`. You can easily modify the colors by changing the variables at the top of the file:

```scss
// Customizable Color Palette
$primary-color: #3498db;      // Main brand color
$secondary-color: #2ecc71;    // Secondary brand color
$accent-color: #f39c12;       // Accent color for highlights
$dark-color: #2c3e50;         // Dark color for text and backgrounds
$light-color: #ecf0f1;        // Light color for backgrounds
$white-color: #ffffff;        // White color
$error-color: #e74c3c;        // Error/danger color
$success-color: #27ae60;      // Success color
```

### Fonts
Font settings can also be customized in the same SASS file:

```scss
// Font settings
$primary-font: 'Poppins', sans-serif;
$heading-font: 'Montserrat', sans-serif;
$base-font-size: 16px;
$heading-font-weight: 700;
$body-font-weight: 400;
```

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables in a `.env` file:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=talent_query_db
   ```

3. Compile SASS to CSS:
   ```
   npm run sass
   ```

4. Start the server:
   ```
   npm start
   ```

## Database Setup
The application will automatically create the necessary database and tables when started. Make sure your MySQL server is running and the credentials in the `.env` file are correct.

## File Uploads
Uploaded files are stored in the `src/public/uploads` directory, organized by type:
- Blog images: `uploads/blog/`
- Candidate photos: `uploads/photos/`
- Candidate CVs: `uploads/cvs/`

## Future Enhancements
As mentioned in the requirements, an OpenAI-enabled chatbot was planned but not implemented due to reported errors. This can be added in a future update.
