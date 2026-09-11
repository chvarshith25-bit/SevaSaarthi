import http from "node:http";

const TARGET_PORT = parseInt(process.env.TARGET_PORT || "3000", 10);
const PROXY_PORT = parseInt(process.env.PORT || "3001", 10);

const server = http.createServer((req, res) => {
  const headers = { ...req.headers };
  headers.host = `localhost:${PROXY_PORT}`;
  headers["x-forwarded-host"] = `localhost:${PROXY_PORT}`;
  headers["x-forwarded-port"] = `${PROXY_PORT}`;

  const options = {
    hostname: "127.0.0.1",
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const resHeaders = { ...proxyRes.headers };
    if (resHeaders.location) {
      resHeaders.location = resHeaders.location.replace(`:${TARGET_PORT}`, `:${PROXY_PORT}`);
    }
    res.writeHead(proxyRes.statusCode || 200, resHeaders);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error(`[Gov Proxy :${PROXY_PORT} -> :${TARGET_PORT}] Connection error:`, err.message);
    res.writeHead(502, { "Content-Type": "text/html" });
    res.end(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;background:#0A1128;color:#fff;">` +
      `<h2>502 Gateway Unavailable</h2>` +
      `<p>Unable to connect to Next.js server on port ${TARGET_PORT}. Ensure <code>npm run dev</code> or <code>npm run dev:citizen</code> is running.</p>` +
      `</body></html>`
    );
  });

  req.pipe(proxyReq, { end: true });
});

server.on("upgrade", (req, clientSocket, head) => {
  const headers = { ...req.headers };
  headers.host = `127.0.0.1:${TARGET_PORT}`;

  const proxyReq = http.request({
    hostname: "127.0.0.1",
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers,
  });

  proxyReq.on("upgrade", (proxyRes, upstreamSocket, proxyHead) => {
    clientSocket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
      Object.entries(proxyRes.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n") +
      `\r\n\r\n`
    );
    if (proxyHead && proxyHead.length) clientSocket.write(proxyHead);
    if (head && head.length) upstreamSocket.write(head);

    upstreamSocket.pipe(clientSocket);
    clientSocket.pipe(upstreamSocket);

    clientSocket.on("error", () => upstreamSocket.destroy());
    upstreamSocket.on("error", () => clientSocket.destroy());
  });

  proxyReq.on("error", (err) => {
    clientSocket.destroy();
  });

  proxyReq.end();
});

server.listen(PROXY_PORT, () => {
  console.log(`========================================================`);
  console.log(`   FORMLY GOVERNMENT PLATFORM PROXY`);
  console.log(`   URL: http://localhost:${PROXY_PORT}`);
  console.log(`   Origin: Host: localhost:${PROXY_PORT}`);
  console.log(`========================================================`);
});
