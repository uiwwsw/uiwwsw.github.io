#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateCacheVersion = () => {
  const now = new Date();
  const timestamp = now.getTime();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `uiwwsw-${dateStr}-${timestamp}`;
};

function replaceBuildPlaceholder(filePath, placeholder, value) {
  const content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes(placeholder)) {
    return false;
  }

  fs.writeFileSync(filePath, content.replaceAll(placeholder, value));
  return true;
}

function getAllFiles(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dirPath, entry.name);
    return entry.isDirectory() ? getAllFiles(entryPath) : entryPath;
  });
}

function replacePlaceholderInDist(distPath, placeholder, value) {
  const files = getAllFiles(distPath);
  let replacements = 0;

  files.forEach((filePath) => {
    if (replaceBuildPlaceholder(filePath, placeholder, value)) {
      replacements += 1;
    }
  });

  if (replacements === 0) {
    throw new Error(`Placeholder ${placeholder} not found in ${distPath}`);
  }

  return replacements;
}

const newCacheVersion = generateCacheVersion();
const distDir = path.join(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  throw new Error('Build output not found. Run `vite build` before versioning dist assets.');
}

const cacheVersionReplacements = replacePlaceholderInDist(
  distDir,
  '__CACHE_VERSION__',
  newCacheVersion
);
const swVersionReplacements = replacePlaceholderInDist(
  distDir,
  '__SW_VERSION__',
  newCacheVersion
);

console.log(
  `Versioned dist assets with cache version: ${newCacheVersion} `
  + `(${cacheVersionReplacements} cache placeholder files, `
  + `${swVersionReplacements} service worker placeholder files)`
);
