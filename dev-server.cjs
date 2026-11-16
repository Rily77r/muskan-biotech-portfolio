const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp"
};

// Serve the same files that the production build copies.
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const file = pathname === "/" ? "/index.html" : pathname;
    if (!/^\/(?:index\.html|style\.css|app\.js|portfolio\.js|assets\/[\w./ -]+)$/.test(file)
        || file.split("/").some(part => part === ".." || part.startsWith("."))) {
      response.writeHead(404).end("Page unavailable");
      return;
    }
    const data = await fs.readFile(path.join(__dirname, file.slice(1)));
    response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    response.end(data);
  } catch {
    response.writeHead(404).end("Page unavailable");
  }
}).listen(Number(process.env.PORT) || 5173, "0.0.0.0", () => {
  console.log("Local preview: http://localhost:" + (Number(process.env.PORT) || 5173));
});
