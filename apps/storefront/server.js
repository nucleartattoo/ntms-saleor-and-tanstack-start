import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import serverEntrypoint from "./dist/server/server.js";

const port = Number.parseInt(process.env.PORT || "3010", 10);
const clientDir = resolve(process.cwd(), "dist/client");
const staticAssets = new Set([
  "/apple-touch-icon.png",
  "/nuclear-favicon.svg",
  "/favicon.ico",
  "/logo.png",
  "/robots.txt",
  "/site.webmanifest",
]);

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".htm", "text/html; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function toHeaders(rawHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
      continue;
    }
    headers.set(key, value);
  }
  return headers;
}

function resolveStaticPath(pathname) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, "");
  const filePath = resolve(clientDir, cleanPath);
  if (!filePath.startsWith(`${clientDir}${sep}`) && filePath !== clientDir) {
    return null;
  }
  return filePath;
}

function contentTypeFor(filePath) {
  return mimeTypes.get(extname(filePath)) || "application/octet-stream";
}

function normalizedHost(value) {
  return String(value || "")
    .split(",", 1)[0]
    .trim()
    .toLowerCase();
}

function isNonCanonicalStorefrontHost(host) {
  const configuredUrl = process.env.VITE_WEBSITE_URL;
  if (!configuredUrl) {
    return false;
  }

  try {
    const configuredHost = new URL(configuredUrl).host.toLowerCase();
    const requestHost = normalizedHost(host);
    return Boolean(requestHost) && requestHost !== configuredHost;
  } catch {
    return false;
  }
}

async function serveStatic(req, res, pathname) {
  const shouldCheck =
    pathname.startsWith("/assets/") ||
    staticAssets.has(pathname) ||
    /\.[a-z0-9]+$/i.test(pathname);

  if (!shouldCheck) {
    return false;
  }

  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    return false;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return false;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", contentTypeFor(filePath));
    res.setHeader(
      "Cache-Control",
      pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
    );
    res.setHeader("Content-Length", fileStat.size);

    if (req.method === "HEAD") {
      res.end();
      return true;
    }

    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host || `127.0.0.1:${port}`;
    const url = new URL(req.url || "/", `http://${host}`);
    const forwardedHost = req.headers["x-forwarded-host"] || host;

    if (isNonCanonicalStorefrontHost(forwardedHost)) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }

    if (await serveStatic(req, res, url.pathname)) {
      return;
    }

    const headers = toHeaders(req.headers);
    const hasBody = !["GET", "HEAD"].includes(req.method || "GET");
    const requestAbortController = new AbortController();
    req.once("aborted", () => requestAbortController.abort());
    res.once("close", () => {
      if (!res.writableEnded) {
        requestAbortController.abort();
      }
    });
    const requestInit = {
      method: req.method,
      headers,
      signal: requestAbortController.signal,
      ...(hasBody
        ? {
            body: Readable.toWeb(req),
            duplex: "half",
          }
        : {}),
    };

    const response = await serverEntrypoint.fetch(new Request(url, requestInit));

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (req.method === "HEAD" || !response.body) {
      res.end();
      return;
    }

    const responseStream = Readable.fromWeb(response.body);
    responseStream.on("error", (error) => {
      if (!requestAbortController.signal.aborted) {
        console.error("SSR response stream error", error);
      }
      if (!res.destroyed) {
        res.destroy(error);
      }
    });
    res.on("close", () => {
      if (!responseStream.destroyed) {
        responseStream.destroy();
      }
    });
    responseStream.pipe(res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    res.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Storefront server listening on http://0.0.0.0:${port}`);
});

let shutdownStarted = false;

function shutdown(signal) {
  if (shutdownStarted) return;
  shutdownStarted = true;
  console.log(`Storefront received ${signal}; draining connections`);

  const forceCloseTimer = setTimeout(() => {
    console.error("Storefront graceful shutdown timed out");
    server.closeAllConnections();
    process.exitCode = 1;
  }, 20_000);
  forceCloseTimer.unref();

  server.close((error) => {
    clearTimeout(forceCloseTimer);
    if (error) {
      console.error("Storefront shutdown error", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
