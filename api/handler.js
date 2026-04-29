import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, "..", "dist", "server", "server.js");

let serverPromise = null;

function getServer() {
  if (!serverPromise) {
    serverPromise = import(serverPath).then((m) => m.default);
  }
  return serverPromise;
}

export default async function handler(req, res) {
  try {
    const server = await getServer();

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const url = `${protocol}://${host}${req.url}`;

    const reqHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        for (const v of value) reqHeaders.append(key, v);
      } else {
        reqHeaders.set(key, value);
      }
    }

    const method = req.method || "GET";
    const isBodyless = method === "GET" || method === "HEAD";

    const webReq = new Request(url, {
      method,
      headers: reqHeaders,
      ...(isBodyless ? {} : { body: Readable.toWeb(req), duplex: "half" }),
    });

    const webRes = await server.fetch(webReq);

    res.status(webRes.status);
    for (const [key, value] of webRes.headers.entries()) {
      if (key.toLowerCase() === "set-cookie") {
        res.appendHeader(key, value);
      } else {
        res.setHeader(key, value);
      }
    }

    if (webRes.body) {
      Readable.fromWeb(webRes.body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error("[handler] error:", err);
    res.status(500).end(`Server error: ${err.message}`);
  }
}
