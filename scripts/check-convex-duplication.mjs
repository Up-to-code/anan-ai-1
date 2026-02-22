#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const CANON = path.join(ROOT, 'convex');
const ADMIN = path.join(ROOT, 'admin', 'convex');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts', 'convex-drift-allowlist.json');
const AREAS = ['agents', 'services', 'channels', 'domain'];
const IGNORE_DIRS = new Set(['_generated', 'node_modules']);
const driftAllowlist = fs.existsSync(ALLOWLIST_PATH)
  ? new Set(JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8')))
  : new Set();

function walk(rootDir, currentDir = rootDir, out = []) {
  if (!fs.existsSync(currentDir)) return out;
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const p = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(rootDir, p, out);
      continue;
    }
    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;
    out.push(path.relative(rootDir, p));
  }
  return out;
}

function hash(p) {
  return crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
}

function isCanonicalReExport(adminPath, area, rel) {
  const text = fs.readFileSync(adminPath, 'utf8').trim();
  const expected = `export * from "../../../convex/${area}/${rel.replace(/\\\\/g, '/').replace(/\\.tsx?$/, '')}";`;
  return text.endsWith(expected);
}

const diffs = [];
let overlapCount = 0;
for (const area of AREAS) {
  const canonDir = path.join(CANON, area);
  const adminDir = path.join(ADMIN, area);
  if (!fs.existsSync(canonDir) || !fs.existsSync(adminDir)) continue;
  const canonFiles = walk(canonDir).map((rel) => rel.replace(/\\/g, '/'));
  for (const rel of canonFiles) {
    const canonPath = path.join(canonDir, rel);
    const adminPath = path.join(adminDir, rel);
    if (!fs.existsSync(adminPath)) continue;
    overlapCount += 1;
    if (hash(canonPath) !== hash(adminPath)) {
      if (!isCanonicalReExport(adminPath, area, rel)) {
        diffs.push(`${area}/${rel}`);
      }
    }
  }
}

console.log(`Overlap files: ${overlapCount}`);
console.log(`Drifted files: ${diffs.length}`);
for (const f of diffs.slice(0, 100)) console.log(`DRIFT ${f}`);
const unexpectedDrifts = diffs.filter((d) => !driftAllowlist.has(d));
const resolvedBaselineDrifts = [...driftAllowlist].filter((d) => !diffs.includes(d));
console.log(`Unexpected drifts: ${unexpectedDrifts.length}`);
console.log(`Resolved baseline drifts: ${resolvedBaselineDrifts.length}`);
for (const f of unexpectedDrifts.slice(0, 100)) console.log(`NEW_DRIFT ${f}`);

if (unexpectedDrifts.length > 0) {
  console.error('\nUnexpected convex drift detected. Sync /admin/convex or update allowlist intentionally.');
  process.exit(1);
}

console.log('Convex duplication drift check passed (no unexpected drift).');
