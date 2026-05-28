// Node HTTP server wrapper for the TanStack Start bundle.
// `dist/server/server.js` exports a Web-Fetch-style handler { fetch(req) }.
// We translate node:http <-> Web Request/Response so it runs under plain Node.

import { createServer } from "node:http";
import { Readable } from "node:stream";
import server from "./dist/server/server.js";

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

function nodeReqToWebRequest(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["host"] || `${HOST}:${PORT}`;
  const url = new URL(req.url, `${proto}://${host}`);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
    else if (v != null) headers.set(k, v);
  }
  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = Readable.toWeb(req);
    init.duplex = "half";
  }
  return new Request(url, init);
}

async function pipeWebToNode(response, res) {
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  if (response.body) {
    Readable.fromWeb(response.body).pipe(res);
  } else {
    res.end();
  }
}

const httpServer = createServer(async (req, res) => {
  try {
    const request = nodeReqToWebRequest(req);
    const response = await server.fetch(request);
    await pipeWebToNode(response, res);
  } catch (err) {
    console.error("[storefront] request error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
    }
    res.end("Internal Server Error");
  }
});

httpServer.listen(PORT, HOST, () => {
  console.log(`[storefront] listening on http://${HOST}:${PORT}`);
});

for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    httpServer.close(() => process.exit(0));
  });
}
