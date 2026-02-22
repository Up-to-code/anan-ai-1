#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MAX_WARN = 60;
const MAX_HARD = 120;
const SCOPES = [
  'convex/agents',
  'convex/services',
  'web/components/chat',
];
const IGNORE_DIRS = new Set(['_generated', 'node_modules', '.next', 'dist', '.expo']);
const IGNORE_SUFFIXES = ['.md', '.lock', '.snap', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
const ALLOWLIST_PATH = path.join(ROOT, 'scripts', 'max-lines-allowlist.json');

const allowlist = fs.existsSync(ALLOWLIST_PATH)
  ? new Set(JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8')))
  : new Set();

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    const rel = path.relative(ROOT, p);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(p, out);
      continue;
    }
    if (IGNORE_SUFFIXES.some((s) => entry.name.endsWith(s))) continue;
    out.push(rel.replace(/\\/g, '/'));
  }
  return out;
}

const files = SCOPES.flatMap((scope) => walk(path.join(ROOT, scope)));
const warnings = [];
const hardFailures = [];

for (const rel of files) {
  const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const lines = content.split(/\r?\n/).length;
  if (lines > MAX_WARN) warnings.push({ rel, lines });
  if (lines > MAX_HARD && !allowlist.has(rel)) hardFailures.push({ rel, lines });
}

warnings.sort((a, b) => b.lines - a.lines);
if (warnings.length) {
  console.log(`Max-lines warning (> ${MAX_WARN}) count: ${warnings.length}`);
  for (const item of warnings.slice(0, 50)) {
    console.log(`WARN ${String(item.lines).padStart(4)} ${item.rel}`);
  }
}

if (hardFailures.length) {
  console.error(`\nMax-lines hard failures (> ${MAX_HARD}) not in allowlist:`);
  for (const item of hardFailures) {
    console.error(`FAIL ${String(item.lines).padStart(4)} ${item.rel}`);
  }
  process.exit(1);
}

console.log('\nMax-lines check passed.');
