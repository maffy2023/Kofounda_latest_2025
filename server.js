const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

console.log("Starting Kofounda app server...");

// Serve static files from various potential locations
const buildClientPath = path.join(__dirname, "build", "client");
const buildPath = path.join(__dirname, "build");
const publicPath = path.join(__dirname, "public");

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// API routes without using complex path-to-regexp patterns
app.use('/api', (req, res, next) => {
  const url = req.url;
  
  // Simple routing without path-to-regexp
  if (url.startsWith('/chat')) {
    return res.json({ message: "Chat API placeholder" });
  }
  
  if (url.startsWith('/models')) {
    return res.json({ 
      models: [
        { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic" },
        { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", provider: "anthropic" },
        { id: "gpt-4", name: "GPT-4", provider: "openai" }
      ]
    });
  }
  
  // Default API response
  return res.json({ status: "API is running" });
});

// Serve static files from the most specific to least specific locations
if (fs.existsSync(buildClientPath)) {
  console.log(`Serving files from ${buildClientPath}`);
  app.use(express.static(buildClientPath));
}

if (fs.existsSync(buildPath)) {
  console.log(`Serving files from ${buildPath}`);
  app.use(express.static(buildPath));
}

if (fs.existsSync(publicPath)) {
  console.log(`Serving files from ${publicPath}`);
  app.use("/public", express.static(publicPath));
}

// Basic fallback index page if nothing else works
const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Kofounda App</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f7f7f7; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { color: #b44aff; margin-bottom: 20px; }
    p { line-height: 1.6; color: #333; }
    .card { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Kofounda App</h1>
      <p>The application is running, but could not find the built client files.</p>
      <p>Please check the server logs for more information.</p>
    </div>
  </div>
</body>
</html>
`;

// Simple catch-all that serves index.html from the best available location
app.get("*", (req, res) => {
  // Try to find index.html in different locations
  const indexLocations = [
    path.join(buildClientPath, "index.html"),
    path.join(buildPath, "index.html"),
    path.join(__dirname, "index.html")
  ];
  
  for (const location of indexLocations) {
    if (fs.existsSync(location)) {
      console.log(`Serving index.html from ${location}`);
      return res.sendFile(location);
    }
  }
  
  // If no index.html is found, return the fallback
  console.log("No index.html found, serving fallback");
  res.send(fallbackHtml);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Current directory: ${__dirname}`);
  try {
    console.log(`Available directories: ${fs.readdirSync(__dirname).join(", ")}`);
  } catch (error) {
    console.error("Error listing directory:", error);
  }
}); 