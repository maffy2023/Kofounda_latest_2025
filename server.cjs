const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Define paths
const buildPath = path.join(__dirname, 'build');
const clientPath = path.join(buildPath, 'client');
const publicPath = path.join(__dirname, 'public');

console.log(`Starting server...`);
console.log(`Current directory: ${__dirname}`);
console.log(`Available directories: ${fs.existsSync(__dirname) ? fs.readdirSync(__dirname).join(', ') : 'none'}`);

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Determine which static directory to use
let staticPath = null;
if (fs.existsSync(clientPath)) {
  staticPath = clientPath;
  console.log(`Serving static files from: ${staticPath}`);
} else if (fs.existsSync(buildPath)) {
  staticPath = buildPath;
  console.log(`Serving static files from: ${staticPath}`);
} else {
  console.log(`WARNING: Neither ${clientPath} nor ${buildPath} exists!`);
  // Create a minimal build directory with an index.html
  if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath, { recursive: true });
  }
  
  const fallbackHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Kofounda App</title>
    <style>
      body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
      h1 { color: #b44aff; }
    </style>
  </head>
  <body>
    <h1>Kofounda App</h1>
    <p>The application is running but couldn't find the build directory.</p>
    <p>This is a fallback page created by the server.</p>
  </body>
  </html>
  `;
  
  fs.writeFileSync(path.join(buildPath, 'index.html'), fallbackHtml);
  staticPath = buildPath;
  console.log(`Created fallback index.html in ${staticPath}`);
}

// Serve static files
app.use(express.static(staticPath));
if (fs.existsSync(publicPath)) {
  app.use('/public', express.static(publicPath));
  console.log(`Serving public files from: ${publicPath}`);
}

// For any request that doesn't match static assets, serve index.html
app.get('*', (req, res) => {
  try {
    const indexPath = path.join(staticPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`
        <html>
          <head>
            <title>App Loading Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #b44aff; }
            </style>
          </head>
          <body>
            <h1>Application Error</h1>
            <p>The application could not be loaded properly. The index.html file is missing.</p>
            <p>Please check the server logs for more information.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Server Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #ff4a4a; }
          </style>
        </head>
        <body>
          <h1>Server Error</h1>
          <p>The server encountered an error while serving the application.</p>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 