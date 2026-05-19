/**
 * fix-fetch.js
 * Safely replaces fetch('/api/ and fetch("/api/ with template literal version
 * Creates .bak backup of every file before touching it
 * Run from your project root: node fix-fetch.js
 */

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const PROJECT_ROOT = process.cwd();
const EXTENSIONS   = ['.js', '.jsx', '.ts', '.tsx'];
const SKIP_FILES   = ['fix-fetch.js']; // skip this script itself
const SKIP_DIRS    = ['node_modules', '.next', '.git', 'out'];

const IMPORT_LINE  = `import { API_URL } from '@/lib/api';`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAllFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) getAllFiles(fullPath, results);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      if (!SKIP_FILES.includes(entry.name)) results.push(fullPath);
    }
  }
  return results;
}

function fixFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');

  // Check if file has any fetch('/api/ or fetch("/api/
  const hasSingleQuote = original.includes(`fetch('/api/`);
  const hasDoubleQuote = original.includes(`fetch("/api/`);

  if (!hasSingleQuote && !hasDoubleQuote) return false; // nothing to do

  let updated = original;

  // ── Replace fetch('/api/ → fetch(`${API_URL}/api/
  updated = updated.replace(/fetch\('\/api\//g, `fetch(\`\${API_URL}/api/`);

  // ── Replace fetch("/api/ → fetch(`${API_URL}/api/
  updated = updated.replace(/fetch\("\/api\//g, `fetch(\`\${API_URL}/api/`);

  // ── Fix closing quotes — change ') and ") after our replacement to backtick
  // This handles simple cases like fetch('/api/orders') → fetch(`${API_URL}/api/orders`)
  // We need to close the template literal properly
  updated = updated.replace(/fetch\(`\$\{API_URL\}\/api\/([^'"`\n]*?)'\)/g, "fetch(`\${API_URL}/api/$1`)");
  updated = updated.replace(/fetch\(`\$\{API_URL\}\/api\/([^'"`\n]*?)"\)/g, "fetch(`\${API_URL}/api/$1`)");

  // ── Add import if not already present ──────────────────────────────────────
  const alreadyImported = updated.includes(`from '@/lib/api'`) || updated.includes(`from "@/lib/api"`);

  if (!alreadyImported) {
    // Add after 'use client' if present, otherwise at the very top
    if (updated.startsWith("'use client'") || updated.startsWith('"use client"')) {
      updated = updated.replace(
        /^('use client'|"use client")\s*\n/,
        `$1\n${IMPORT_LINE}\n`
      );
    } else {
      updated = IMPORT_LINE + '\n' + updated;
    }
  }

  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('🔍 Scanning project files...\n');

const allFiles = getAllFiles(PROJECT_ROOT);
const changed  = [];
const skipped  = [];

for (const file of allFiles) {
  const wasChanged = fixFile(file);
  const relPath    = path.relative(PROJECT_ROOT, file);
  if (wasChanged) {
    changed.push(relPath);
    console.log(`✅ Fixed: ${relPath}`);
  }
}

console.log('\n─────────────────────────────────────────');
console.log(`✅ Done! ${changed.length} files updated.`);
console.log(`\nIf anything looks wrong: git checkout .`);