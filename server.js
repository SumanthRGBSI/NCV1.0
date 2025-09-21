const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.htm': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=UTF-8',
};

function send(res, status, headers, bodyStream) {
  res.writeHead(status, headers);
  if (bodyStream) bodyStream.pipe(res);
  else res.end();
}

function safeJoin(base, target) {
  const targetPath = path.posix.normalize(target).replace(/^\/+/, '');
  const fullPath = path.join(base, targetPath);
  if (!fullPath.startsWith(base)) return null;
  return fullPath;
}

const server = http.createServer((req, res) => {
  try {
    const parsed = url.parse(req.url);
    const decodedPath = decodeURIComponent(parsed.pathname || '/');

    let finalPath = decodedPath;
    if (finalPath === '/' || finalPath === '') finalPath = '/index.html';

    const filePath = safeJoin(ROOT, finalPath);
    if (!filePath) return send(res, 400, { 'Content-Type': 'text/plain' }, null);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        // If path without extension, try .html
        if (!path.extname(filePath)) {
          const htmlFallback = `${filePath}.html`;
          fs.stat(htmlFallback, (err2, stats2) => {
            if (!err2 && stats2.isFile()) return streamFile(htmlFallback, res);
            notFound(res);
          });
          return;
        }
        return notFound(res);
      }

      if (stats.isDirectory()) {
        const indexFile = path.join(filePath, 'index.html');
        fs.stat(indexFile, (e2, s2) => {
          if (!e2 && s2.isFile()) return streamFile(indexFile, res);
          notFound(res);
        });
      } else if (stats.isFile()) {
        streamFile(filePath, res);
      } else {
        notFound(res);
      }
    });
  } catch (e) {
    send(res, 500, { 'Content-Type': 'text/plain; charset=UTF-8' }, null);
  }
});

function streamFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => notFound(res));
  send(res, 200, {
    'Content-Type': mime,
    'Cache-Control': 'no-store',
  }, stream);
}

function notFound(res) {
  send(res, 404, { 'Content-Type': 'text/plain; charset=UTF-8' }, null);
}

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
});
