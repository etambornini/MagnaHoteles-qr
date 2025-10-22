#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const sourceDir = path.resolve(__dirname, "../src/generated/prisma");
const targetDir = path.resolve(__dirname, "../dist/generated/prisma");

if (!fs.existsSync(sourceDir)) {
  console.error(`[copyPrisma] Source directory not found: ${sourceDir}`);
  process.exit(0);
}

const copyRecursiveSync = (src, dest) => {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stats.isFile()) {
    fs.copyFileSync(src, dest);
  }
};

fs.rmSync(targetDir, { recursive: true, force: true });
copyRecursiveSync(sourceDir, targetDir);
console.log(`[copyPrisma] Copied Prisma client to ${targetDir}`);
