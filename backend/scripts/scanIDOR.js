#!/usr/bin/env node
// Static scan for common BOLA/IDOR patterns in Express routes.
// The scanner is heuristic. Each finding is a suggestion to inspect,
// not a proof of vulnerability.

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../src');

const HIGH_CONFIDENCE = [
  { regex: /req\.body\.(userId|patientId|caregiverId|ownerId)\b/g,
    label: 'reads identity field from req.body' },
  { regex: /req\.query\.(userId|patientId|caregiverId|ownerId)\b/g,
    label: 'reads identity field from req.query' },
];

const MEDIUM_CONFIDENCE = [
  { regex: /findByPk\(\s*req\.params\.\w+\s*\)/g,
    label: 'findByPk(req.params.x) without a user scope on the same line' },
  { regex: /findOne\(\s*\{\s*where\s*:\s*\{\s*id\s*:\s*req\.params\./g,
    label: 'findOne({where:{id:req.params.x}}) without a visible user scope' },
];

// If a query contains any of these within the same statement / nearby
// lines, we consider the user scope to be present and drop the finding.
const INLINE_DEFENSES = [
  /userId\s*:\s*req\.user\.id/,
  /caregiverId\s*:\s*req\.user\.id/,
  /\[Op\.or\]/,
  /Op\.in\s*:\s*assignedPatientIds/,
];

// If the route declaration itself passes requirePatientAccess or
// requireRole(['admin']) as middleware, we consider the handler safe.
const ROUTE_MW_DEFENSE = /(requirePatientAccess|requireRole\s*\(\s*\[\s*['"]admin['"])/;

function findStatementEnd(src, startIdx) {
  // Rough heuristic: find the next `;` at the same brace depth.
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i];
    if (c === '(' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '}' || c === ']') depth--;
    else if (c === ';' && depth <= 0) return i;
  }
  return Math.min(src.length, startIdx + 400); // cap
}

function hasInlineDefense(src, matchIdx) {
  const endIdx = findStatementEnd(src, matchIdx);
  const stmt = src.slice(matchIdx, endIdx);
  return INLINE_DEFENSES.some((re) => re.test(stmt));
}

function isInsideProtectedRoute(src, matchIdx) {
  // Look back for the nearest router.<verb>(...) declaration.
  const before = src.slice(0, matchIdx);
  const lastRoute = before.lastIndexOf('router.');
  if (lastRoute === -1) return false;
  const routeHeader = src.slice(lastRoute, matchIdx);
  return ROUTE_MW_DEFENSE.test(routeHeader);
}

function analyze(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');
  const findings = [];

  const push = (match, label, severity) => {
    const lineNum = src.slice(0, match.index).split('\n').length;
    findings.push({
      line: lineNum,
      label,
      severity,
      snippet: (lines[lineNum - 1] || '').trim(),
    });
  };

  for (const { regex, label } of HIGH_CONFIDENCE) {
    for (const match of src.matchAll(regex)) {
      // Some routes legitimately accept patientId from the caller and
      // then validate with requirePatientAccess. Skip if that middleware
      // is in the route header.
      if (isInsideProtectedRoute(src, match.index)) continue;
      push(match, label, 'high');
    }
  }

  for (const { regex, label } of MEDIUM_CONFIDENCE) {
    for (const match of src.matchAll(regex)) {
      if (hasInlineDefense(src, match.index)) continue;
      if (isInsideProtectedRoute(src, match.index)) continue;
      push(match, label, 'medium');
    }
  }

  return findings;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function main() {
  const files = walk(SRC).filter(
    (f) => f.includes(`${path.sep}routes${path.sep}`) || f.includes(`${path.sep}controllers${path.sep}`)
  );

  let high = 0;
  let medium = 0;

  console.log('\nIDOR/BOLA scan\n' + '='.repeat(60));

  for (const file of files) {
    const findings = analyze(file);
    if (findings.length === 0) continue;

    const rel = path.relative(SRC, file);
    console.log(`\n\x1b[33m${rel}\x1b[0m`);

    for (const f of findings) {
      if (f.severity === 'high') high++;
      else medium++;
      const tag = f.severity === 'high' ? '\x1b[31mHIGH\x1b[0m' : '\x1b[33mMED\x1b[0m ';
      console.log(`  ${tag}  L${f.line}  ${f.label}`);
      console.log(`         ${f.snippet}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`High-confidence findings: ${high}`);
  console.log(`Medium-confidence findings: ${medium}`);
  if (high === 0 && medium === 0) {
    console.log('No IDOR patterns detected.');
  } else {
    console.log('Inspect each finding. Not all are exploitable.');
  }
  if (high > 0) process.exitCode = 1;
}

main();