{
  "version": 2,
  "builds": [
    { "src": "index.html", "use": "@vercel/static" },
    { "src": "api/chat.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/chat", "dest": "/api/chat.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
