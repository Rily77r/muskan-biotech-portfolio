const fs = require("node:fs");
const path = require("node:path");

const dist = path.join(__dirname, "dist");
fs.mkdirSync(dist, { recursive: true });

for (const file of ["index.html", "style.css", "portfolio.js", "app.js", ".nojekyll"]) {
  fs.copyFileSync(path.join(__dirname, file), path.join(dist, file));
}

const assets = path.join(__dirname, "assets");
const builtAssets = path.join(dist, "assets");
fs.rmSync(builtAssets, { recursive: true, force: true });
if (fs.existsSync(assets)) fs.cpSync(assets, builtAssets, { recursive: true });
