const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const configPath = path.join(root, "config.json");
const port = Number(process.env.PORT) || 4173;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function readConfig() {
  return fs.readFileSync(configPath);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  if (url.pathname === "/api/config" && req.method === "GET") {
    try {
      send(res, 200, readConfig(), "application/json; charset=utf-8");
    } catch {
      send(res, 500, JSON.stringify({ error: "config missing" }), "application/json; charset=utf-8");
    }
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  if (pathname.includes("\0")) {
    send(res, 400, "bad request", "text/plain; charset=utf-8");
    return;
  }

  const file = path.normalize(path.join(root, pathname));
  if (!file.startsWith(root)) {
    send(res, 403, "forbidden", "text/plain; charset=utf-8");
    return;
  }

  fs.readFile(file, (err, data) => {
    if (!err) {
      const ext = path.extname(file).toLowerCase();
      send(res, 200, data, types[ext] || "application/octet-stream");
      return;
    }

    if (!path.extname(pathname)) {
      fs.readFile(path.join(root, "index.html"), (htmlErr, html) => {
        if (htmlErr) {
          send(res, 404, "not found", "text/plain; charset=utf-8");
          return;
        }
        send(res, 200, html, types[".html"]);
      });
      return;
    }

    send(res, 404, "not found", "text/plain; charset=utf-8");
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`zonki clone http://127.0.0.1:${port}`);
});
