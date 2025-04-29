const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Define paths
const buildPath = path.join(__dirname, 'build');
const clientPath = path.join(buildPath, 'client');
const publicPath = path.join(__dirname, 'public');

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Check if client directory exists, otherwise use build directly
const staticPath = fs.existsSync(clientPath) ? clientPath : buildPath;
console.log(`Serving static files from: ${staticPath}`);

// Serve static files
app.use(express.static(staticPath));
app.use('/public', express.static(publicPath));

// Handle API routes if any
// app.use('/api', apiRoutes);

// For any request that doesn't match an API or static asset, serve index.html
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <html>
        <head><title>App Loading Error</title></head>
        <body>
          <h1>Application Error</h1>
          <p>The application could not be loaded properly. The build directory may be missing.</p>
          <p>Please check the server logs for more information.</p>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Current directory: ${__dirname}`);
  console.log(`Available directories: ${fs.readdirSync(__dirname).join(', ')}`);
}); 