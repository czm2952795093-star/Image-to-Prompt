// 零依赖本地开发服务器：复用 api/describe.js，无需登录 Vercel。
// 用法：node local-server.cjs   ->   http://localhost:3000/api/describe
const http = require("http");
const fs = require("fs");
const path = require("path");

// 读取 .env.local 注入 process.env
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith("#")) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const handler = require("./api/describe.js");
const PORT = process.env.PORT || 3000;

http
  .createServer(async (req, res) => {
    // 给 node 的 res 补上 Express 风格的 status/json，让 handler 直接复用
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (obj) => {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(obj));
      return res;
    };
    if (req.url !== "/api/describe") {
      res.status(404).json({ error: "Not found. Use POST /api/describe" });
      return;
    }
    try {
      await handler(req, res);
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ error: String(e && e.message ? e.message : e) });
    }
  })
  .listen(PORT, () => {
    console.log(`local /api/describe -> http://localhost:${PORT}/api/describe`);
    console.log(`key loaded: ${process.env.AIHUBMIX_API_KEY ? "yes" : "NO"} | model: ${process.env.VISION_MODEL || "gpt-5.5"}`);
  });
