#!/usr/bin/env node

import { gzipSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const assetsDirectory = resolve("dist/client/assets");
const maxRawKiB = readBudget("CLIENT_ENTRY_MAX_RAW_KIB", 600);
const maxGzipKiB = readBudget("CLIENT_ENTRY_MAX_GZIP_KIB", 180);
const entryNames = (await readdir(assetsDirectory)).filter(
  (name) => name.startsWith("index-") && name.endsWith(".js"),
);

if (entryNames.length !== 1) {
  throw new Error(
    `Expected one client index chunk in ${assetsDirectory}, found ${entryNames.length}`,
  );
}

const entryName = entryNames[0];
const contents = await readFile(resolve(assetsDirectory, entryName));
const rawKiB = contents.byteLength / 1024;
const gzipKiB = gzipSync(contents).byteLength / 1024;
const withinBudget = rawKiB <= maxRawKiB && gzipKiB <= maxGzipKiB;

console.log(
  JSON.stringify(
    {
      entry: entryName,
      gzipKiB: round(gzipKiB),
      maxGzipKiB,
      maxRawKiB,
      ok: withinBudget,
      rawKiB: round(rawKiB),
    },
    null,
    2,
  ),
);

if (!withinBudget) {
  process.exit(1);
}

function readBudget(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
