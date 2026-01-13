#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate timestamp-based cache version
const generateCacheVersion = () => {
  const now = new Date();
  const timestamp = now.getTime();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `uiwwsw-${dateStr}-${timestamp}`;
};

// Update service worker cache version
const updateServiceWorkerCache = (version) => {
  const swPath = path.join(__dirname, '../public/sw.js');
  const content = fs.readFileSync(swPath, 'utf8');
  const updatedContent = content.replace(
    /const CACHE_NAME = ['"][^'"]+['"];?/,
    `const CACHE_NAME = '${version}';`
  );
  fs.writeFileSync(swPath, updatedContent);
  console.log(`Updated SW cache version to: ${version}`);
};

const updateIndexHtmlSwRegistration = (version) => {
  const htmlPath = path.join(__dirname, '../src/index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');

  const updatedContent = content.replace(
    /navigator\.serviceWorker\.register\(\s*['"]\/sw\.js(?:\?v=[^'"]+)?['"]/,
    `navigator.serviceWorker.register('/sw.js?v=${version}'`
  );

  fs.writeFileSync(htmlPath, updatedContent);
  console.log(`Updated SW registration version to: ${version}`);
};

// Main execution
const newCacheVersion = generateCacheVersion();
updateServiceWorkerCache(newCacheVersion);
updateIndexHtmlSwRegistration(newCacheVersion);
