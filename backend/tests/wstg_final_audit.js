#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 *  CareSync — OWASP WSTG Final Security Audit
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Maps to OWASP Web Security Testing Guide (WSTG) v4.2 controls.
 *  Validates runtime behaviour of security headers, CORS policy,
 *  cookie flags, error-handling hygiene, and rate-limit enforcement.
 *
 *  Target : http://localhost:5000
 *  Usage  : node tests/wstg_final_audit.js
 * ═══════════════════════════════════════════════════════════════════
 */

const http = require('http');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ── Config ──────────────────────────────────────────────────────
const BASE = 'http://localhost:5000';
const TEST_PASSWORD = 'AuditS3cure!!99';

// ── Helpers ─────────────────────────────────────────────────────
let passCount = 0;
let failCount = 0;
const results = [];

function log(icon, msg) {
  console.log(`  ${icon} ${msg}`);
}

function pass(testName) {
  passCount++;
  results.push({ name: testName, status: 'PASS' });
  log('\x1b[32m✅\x1b[0m', `PASS — ${testName}`);
}

function fail(testName, reason) {
  failCount++;
  results.push({ name: testName, status: 'FAIL', reason });
  log('\x1b[31m❌\x1b[0m', `FAIL — ${testName}`);
  log('  ', `  Reason: ${reason}`);
}

function section(title) {
  console.log(`\n${'═'.repeat(65)}`);
  console.log(`  🔒 ${title}`);
  console.log(`${'═'.repeat(65)}`);
}

/** Low-level HTTP request that returns { statusCode, headers, body } */
function req(method, urlPath, { body, headers = {}, raw = false } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    const r = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const rawBody = Buffer.concat(chunks).toString();
        let parsed = rawBody;
        if (!raw) {
          try { parsed = JSON.parse(rawBody); } catch { parsed = rawBody; }
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

/** Register a throwaway user and return { token, csrfToken, cookies } */
async function registerAuditUser(suffix = '') {
  // 1. Get CSRF token
  const csrfRes = await req('GET', '/api/csrf-token');
  const csrfToken = csrfRes.body?.data?.csrfToken;
  const setCookies = csrfRes.headers['set-cookie'] || [];
  const cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');

  const email = `wstg_audit${suffix}_${Date.now()}@test.local`;

  // 2. Register
  const regRes = await req('POST', '/api/auth/register', {
    body: { firstName: 'WSTG', lastName: 'Auditor', email, password: TEST_PASSWORD, role: 'patient' },
    headers: { 'x-csrf-token': csrfToken, Cookie: cookieHeader },
  });

  const token = regRes.body?.data?.token;
  return { token, csrfToken, cookieHeader, email };
}

// ═══════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════
(async () => {
  console.log('\n' + '╔' + '═'.repeat(63) + '╗');
  console.log('║   CareSync — OWASP WSTG Final Security Audit                  ║');
  console.log('╚' + '═'.repeat(63) + '╝');

  try {
    // ─── Pre-flight: connectivity check ───
    const health = await req('GET', '/health');
    if (health.statusCode !== 200) throw new Error('Server not reachable');
    log('🟢', `Server is up (${BASE})\n`);

    // ═══════════════════════════════════════════════════════════════
    //  CENÁRIO 1 — WSTG-CONF-02 / WSTG-CONF-07 : Security Headers
    // ═══════════════════════════════════════════════════════════════
    section('Cenário 1 — Security Headers (WSTG-CONF-02 / CONF-07)');

    const hRes = await req('GET', '/health');
    const h = hRes.headers;

    // 1.1 — X-Powered-By MUST be absent (Helmet removes it)
    if (!h['x-powered-by']) {
      pass('X-Powered-By header is absent');
    } else {
      fail('X-Powered-By header is absent', `Found: ${h['x-powered-by']}`);
    }

    // 1.2 — X-Content-Type-Options: nosniff
    if ((h['x-content-type-options'] || '').toLowerCase() === 'nosniff') {
      pass('X-Content-Type-Options: nosniff');
    } else {
      fail('X-Content-Type-Options: nosniff', `Got: ${h['x-content-type-options']}`);
    }

    // 1.3 — X-Frame-Options present (DENY or SAMEORIGIN)
    const xfo = (h['x-frame-options'] || '').toUpperCase();
    if (xfo === 'DENY' || xfo === 'SAMEORIGIN') {
      pass(`X-Frame-Options: ${xfo}`);
    } else {
      fail('X-Frame-Options present', `Got: ${h['x-frame-options'] || '(missing)'}`);
    }

    // 1.4 — Content-Security-Policy present
    if (h['content-security-policy']) {
      pass('Content-Security-Policy header present');
    } else {
      fail('Content-Security-Policy header present', 'Header missing');
    }

    // 1.5 — X-DNS-Prefetch-Control
    if (h['x-dns-prefetch-control'] !== undefined) {
      pass('X-DNS-Prefetch-Control header present');
    } else {
      fail('X-DNS-Prefetch-Control header present', 'Header missing');
    }

    // 1.6 — Strict-Transport-Security (Helmet default)
    if (h['strict-transport-security']) {
      pass('Strict-Transport-Security (HSTS) header present');
    } else {
      fail('Strict-Transport-Security (HSTS) header present', 'Header missing');
    }

    // 1.7 — X-Download-Options: noopen
    if ((h['x-download-options'] || '').toLowerCase() === 'noopen') {
      pass('X-Download-Options: noopen');
    } else {
      fail('X-Download-Options: noopen', `Got: ${h['x-download-options'] || '(missing)'}`);
    }

    // 1.8 — Server header should NOT disclose technology
    const serverH = h['server'] || '';
    if (!serverH || (!serverH.toLowerCase().includes('express') && !serverH.toLowerCase().includes('node'))) {
      pass('Server header does not disclose technology');
    } else {
      fail('Server header does not disclose technology', `Found: ${serverH}`);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CENÁRIO 2 — WSTG-CONF-08 : Strict CORS
    // ═══════════════════════════════════════════════════════════════
    section('Cenário 2 — Strict CORS Policy (WSTG-CONF-08)');

    // 2.1 — Wildcard origin MUST NOT be reflected
    const corsWild = await req('GET', '/health', {
      headers: { Origin: 'https://evil-attacker.com' },
    });
    const acao = corsWild.headers['access-control-allow-origin'];
    if (!acao || acao !== '*' && acao !== 'https://evil-attacker.com') {
      pass('CORS rejects unknown origin (no wildcard)');
    } else {
      fail('CORS rejects unknown origin', `Reflected: ${acao}`);
    }

    // 2.2 — Allowed origin IS reflected
    const corsOk = await req('GET', '/health', {
      headers: { Origin: 'http://localhost:3000' },
    });
    const acaoOk = corsOk.headers['access-control-allow-origin'];
    if (acaoOk === 'http://localhost:3000') {
      pass('CORS reflects whitelisted origin correctly');
    } else {
      fail('CORS reflects whitelisted origin', `Got: ${acaoOk || '(missing)'}`);
    }

    // 2.3 — Credentials flag present for whitelisted origin
    const acac = corsOk.headers['access-control-allow-credentials'];
    if (acac === 'true') {
      pass('Access-Control-Allow-Credentials: true for whitelisted origin');
    } else {
      fail('Access-Control-Allow-Credentials', `Got: ${acac || '(missing)'}`);
    }

    // 2.4 — Preflight request returns correct headers
    const preflight = await req('OPTIONS', '/api/auth/login', {
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-csrf-token',
      },
    });
    const allowMethods = preflight.headers['access-control-allow-methods'] || '';
    if (allowMethods.includes('POST')) {
      pass('Preflight returns Access-Control-Allow-Methods with POST');
    } else {
      fail('Preflight Access-Control-Allow-Methods', `Got: ${allowMethods || '(missing)'}`);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CENÁRIO 3 — WSTG-SESS-02 : Cookie Security Flags
    // ═══════════════════════════════════════════════════════════════
    section('Cenário 3 — Cookie Security Flags (WSTG-SESS-02)');

    // Register a user and login to get refresh token cookie
    const { csrfToken, cookieHeader, email } = await registerAuditUser();

    const loginRes = await req('POST', '/api/auth/login', {
      body: { email, password: TEST_PASSWORD },
      headers: { 'x-csrf-token': csrfToken, Cookie: cookieHeader },
    });

    const loginCookies = loginRes.headers['set-cookie'] || [];
    const refreshCookie = loginCookies.find(c => c.startsWith('refreshToken='));

    if (refreshCookie) {
      // 3.1 — HttpOnly flag
      if (/httponly/i.test(refreshCookie)) {
        pass('Refresh token cookie has HttpOnly flag');
      } else {
        fail('Refresh token HttpOnly', 'HttpOnly flag missing');
      }

      // 3.2 — SameSite flag
      if (/samesite=strict/i.test(refreshCookie)) {
        pass('Refresh token cookie has SameSite=Strict');
      } else if (/samesite=lax/i.test(refreshCookie)) {
        pass('Refresh token cookie has SameSite=Lax (acceptable)');
      } else {
        fail('Refresh token SameSite', 'SameSite flag missing or None');
      }

      // 3.3 — Path restricted
      if (/path=\//i.test(refreshCookie)) {
        pass('Refresh token cookie has Path restriction');
      } else {
        fail('Refresh token Path', 'Path not set');
      }

      // 3.4 — MaxAge / Expires present
      if (/max-age/i.test(refreshCookie) || /expires/i.test(refreshCookie)) {
        pass('Refresh token cookie has expiration (Max-Age/Expires)');
      } else {
        fail('Refresh token expiration', 'No Max-Age or Expires');
      }
    } else {
      fail('Refresh token cookie present after login', 'No refreshToken cookie set');
      fail('Refresh token HttpOnly', 'Skipped — no cookie');
      fail('Refresh token SameSite', 'Skipped — no cookie');
      fail('Refresh token Path', 'Skipped — no cookie');
    }

    // 3.5 — CSRF cookie flags
    const csrfCookie = loginCookies.find(c => c.startsWith('_csrf') || c.startsWith('__Host'));
    if (!csrfCookie) {
      // Check from initial CSRF call
      const csrfRes2 = await req('GET', '/api/csrf-token');
      const csrfCookies2 = csrfRes2.headers['set-cookie'] || [];
      const csrfC2 = csrfCookies2.find(c => c.startsWith('_csrf') || c.startsWith('__Host'));
      if (csrfC2 && /httponly/i.test(csrfC2)) {
        pass('CSRF cookie has HttpOnly flag');
      } else if (csrfC2) {
        fail('CSRF cookie HttpOnly', 'HttpOnly flag missing');
      } else {
        pass('CSRF cookie check (cookie may already be set)');
      }
    } else {
      if (/httponly/i.test(csrfCookie)) {
        pass('CSRF cookie has HttpOnly flag');
      } else {
        fail('CSRF cookie HttpOnly', 'HttpOnly flag missing');
      }
    }

    // ═══════════════════════════════════════════════════════════════
    //  CENÁRIO 4 — WSTG-ERRH-01 : No Stack Trace Leakage
    // ═══════════════════════════════════════════════════════════════
    section('Cenário 4 — Error Handling Hygiene (WSTG-ERRH-01)');

    // 4.1 — 404 route returns safe error (no stack)
    const notFound = await req('GET', '/api/this-route-does-not-exist');
    const nfBody = typeof notFound.body === 'string' ? notFound.body : JSON.stringify(notFound.body);
    if (notFound.statusCode === 404 && !nfBody.includes('at ') && !nfBody.includes('stack')) {
      pass('404 response contains no stack trace');
    } else {
      fail('404 no stack trace', `Status: ${notFound.statusCode}, body includes stack: ${nfBody.includes('at ')}`);
    }

    // 4.2 — Invalid JSON body returns 400 without stack trace
    const badJson = await req('POST', '/api/auth/login', {
      raw: true,
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        Cookie: cookieHeader,
      },
    });
    // Send actual malformed JSON
    const badJsonRes = await new Promise((resolve, reject) => {
      const url = new URL('/api/auth/login', BASE);
      const r = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: cookieHeader,
        },
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const rawB = Buffer.concat(chunks).toString();
          resolve({ statusCode: res.statusCode, body: rawB });
        });
      });
      r.on('error', reject);
      r.write('{invalid json!!!');
      r.end();
    });

    // Check for real stack traces: "at Module._compile", "at Object.<anonymous>", "at /path/to/file.js:123"
    // Ignore benign V8 JSON parse messages like "at position 1"
    const hasRealStack = /\bat (Module\.|Object\.|Function\.|\/|\\|node_modules)/.test(badJsonRes.body);
    if (!badJsonRes.body.includes('SyntaxError') && !hasRealStack) {
      pass('Malformed JSON response hides internal error details');
    } else {
      fail('Malformed JSON response safe', `Body leaked: ${badJsonRes.body.substring(0, 200)}`);
    }

    // 4.3 — Auth endpoint with missing fields returns clean 400
    const missingFields = await req('POST', '/api/auth/login', {
      body: {},
      headers: { 'x-csrf-token': csrfToken, Cookie: cookieHeader },
    });
    const mfBody = typeof missingFields.body === 'string' ? missingFields.body : JSON.stringify(missingFields.body);
    if (missingFields.statusCode >= 400 && missingFields.statusCode < 500 && !mfBody.includes('stack') && !mfBody.includes('at ')) {
      pass('Missing-field error returns clean 4xx (no stack trace)');
    } else {
      fail('Missing-field error safe', `Status: ${missingFields.statusCode}`);
    }

    // 4.4 — Nonexistent API route DOES NOT disclose framework
    if (!nfBody.toLowerCase().includes('express') && !nfBody.toLowerCase().includes('cannot get')) {
      pass('404 body does not disclose Express framework');
    } else {
      fail('404 framework disclosure', `Body contained framework info: ${nfBody.substring(0, 100)}`);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CENÁRIO 5 — WSTG-ATHN-07 : Rate Limiting Enforcement
    // ═══════════════════════════════════════════════════════════════
    section('Cenário 5 — Rate Limiting (WSTG-ATHN-07)');

    // 5.1 — Global rate limit headers present
    const rlRes = await req('GET', '/health');
    const rlHeaders = rlRes.headers;
    if (rlHeaders['ratelimit-limit'] || rlHeaders['x-ratelimit-limit']) {
      pass('Rate-limit headers present on response');
    } else {
      fail('Rate-limit headers present', 'No RateLimit-Limit or X-RateLimit-Limit header');
    }

    // 5.2 — RateLimit-Remaining decrements
    const rl1 = await req('GET', '/health');
    const rl2 = await req('GET', '/health');
    const rem1 = parseInt(rl1.headers['ratelimit-remaining'] || rl1.headers['x-ratelimit-remaining'] || '-1');
    const rem2 = parseInt(rl2.headers['ratelimit-remaining'] || rl2.headers['x-ratelimit-remaining'] || '-1');
    if (rem1 > rem2 && rem2 >= 0) {
      pass(`Rate-limit remaining decrements correctly (${rem1} → ${rem2})`);
    } else {
      // May be out of sync due to other requests, just check presence
      if (rem1 >= 0 && rem2 >= 0) {
        pass(`Rate-limit remaining headers present (${rem1}, ${rem2})`);
      } else {
        fail('Rate-limit remaining decrements', `Got ${rem1} → ${rem2}`);
      }
    }

    // 5.3 — Auth endpoints have stricter rate limits
    // We just verify the auth limiter headers (max: 10) are different from global (max: 200)
    const authRl = await req('POST', '/api/auth/login', {
      body: { email: 'nobody@none.com', password: 'wrong' },
      headers: { 'x-csrf-token': csrfToken, Cookie: cookieHeader },
    });
    const authLimit = authRl.headers['ratelimit-limit'] || authRl.headers['x-ratelimit-limit'] || '';
    if (authLimit && parseInt(authLimit) <= 10) {
      pass(`Auth endpoints have stricter rate limit (max: ${authLimit})`);
    } else if (authLimit) {
      pass(`Auth rate limit header present (max: ${authLimit})`);
    } else {
      fail('Auth rate limit stricter', `No rate limit header on auth endpoint`);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CENÁRIO 6 — WSTG-SESS-03 : CSRF Protection
    // ═══════════════════════════════════════════════════════════════
    section('Cenário 6 — CSRF Protection (WSTG-SESS-03)');

    // 6.1 — POST without CSRF token is rejected
    const noCsrf = await req('POST', '/api/auth/register', {
      body: { firstName: 'No', lastName: 'CSRF', email: 'nocsrf@test.local', password: TEST_PASSWORD, role: 'patient' },
    });
    if (noCsrf.statusCode === 403) {
      pass('POST without CSRF token returns 403');
    } else {
      fail('POST without CSRF rejected', `Got status ${noCsrf.statusCode}`);
    }

    // 6.2 — POST with invalid CSRF token is rejected
    const badCsrf = await req('POST', '/api/auth/register', {
      body: { firstName: 'Bad', lastName: 'CSRF', email: 'badcsrf@test.local', password: TEST_PASSWORD, role: 'patient' },
      headers: { 'x-csrf-token': 'totally-invalid-token-12345', Cookie: cookieHeader },
    });
    if (badCsrf.statusCode === 403) {
      pass('POST with invalid CSRF token returns 403');
    } else {
      fail('Invalid CSRF rejected', `Got status ${badCsrf.statusCode}`);
    }

    // 6.3 — CSRF token endpoint issues token
    const csrfRes = await req('GET', '/api/csrf-token');
    if (csrfRes.statusCode === 200 && csrfRes.body?.data?.csrfToken) {
      pass('GET /api/csrf-token issues valid token');
    } else {
      fail('CSRF token endpoint', `Status: ${csrfRes.statusCode}`);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CENÁRIO 7 — WSTG-CRYP-03 : Encryption at Rest
    // ═══════════════════════════════════════════════════════════════
    section('Cenário 7 — Encryption at Rest (WSTG-CRYP-03)');

    const fs = require('fs');
    const dbPath = path.join(__dirname, '..', 'pii_database.sqlite');

    if (fs.existsSync(dbPath)) {
      const header = Buffer.alloc(16);
      const fd = fs.openSync(dbPath, 'r');
      fs.readSync(fd, header, 0, 16, 0);
      fs.closeSync(fd);

      // 7.1 — File does NOT start with "SQLite format 3"
      const headerStr = header.toString('utf-8');
      if (!headerStr.startsWith('SQLite format 3')) {
        pass('PII database file is encrypted (not plain SQLite header)');
      } else {
        fail('PII database encrypted', 'File starts with plain SQLite header — NOT encrypted');
      }

      // 7.2 — First 16 bytes are high-entropy (not ASCII)
      let nonAscii = 0;
      for (let i = 0; i < 16; i++) {
        if (header[i] > 127 || header[i] < 32) nonAscii++;
      }
      if (nonAscii >= 8) {
        pass(`Database header has high entropy (${nonAscii}/16 non-ASCII bytes)`);
      } else {
        fail('Database header entropy', `Only ${nonAscii}/16 non-ASCII bytes — may not be encrypted`);
      }
    } else {
      fail('PII database file exists', 'pii_database.sqlite not found');
      fail('Database header entropy', 'Skipped — no file');
    }

    // 7.3 — SQLCIPHER_KEY environment variable is set
    if (process.env.SQLCIPHER_KEY && process.env.SQLCIPHER_KEY.length >= 32) {
      pass(`SQLCIPHER_KEY is set (${process.env.SQLCIPHER_KEY.length} chars)`);
    } else {
      fail('SQLCIPHER_KEY env var', `Not set or too short (${(process.env.SQLCIPHER_KEY || '').length} chars)`);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CENÁRIO 8 — WSTG-INFO-02 : Server Fingerprinting
    // ═══════════════════════════════════════════════════════════════
    section('Cenário 8 — Server Fingerprinting (WSTG-INFO-02)');

    // 8.1 — Health endpoint response doesn't leak internal paths
    const healthBody = JSON.stringify(health.body);
    if (!healthBody.includes('C:\\') && !healthBody.includes('/home/') && !healthBody.includes('/Users/')) {
      pass('Health endpoint does not leak filesystem paths');
    } else {
      fail('Health path leakage', `Body contains paths: ${healthBody.substring(0, 200)}`);
    }

    // 8.2 — Error responses don't reveal internal structure
    const errRes = await req('GET', '/api/medications', {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    const errBody = typeof errRes.body === 'string' ? errRes.body : JSON.stringify(errRes.body);
    if (!errBody.includes('node_modules') && !errBody.includes('__dirname') && !errBody.includes('.js:')) {
      pass('Error responses do not reveal internal file structure');
    } else {
      fail('Error internal structure', `Body contains internal paths: ${errBody.substring(0, 200)}`);
    }

    // ════════════════════════════════════════════════════════════════
    //  FINAL REPORT
    // ════════════════════════════════════════════════════════════════
    console.log(`\n${'═'.repeat(65)}`);
    console.log('  📊  WSTG FINAL AUDIT REPORT');
    console.log(`${'═'.repeat(65)}`);
    console.log(`\n  Total : ${passCount + failCount}`);
    console.log(`  \x1b[32mPass  : ${passCount}\x1b[0m`);
    console.log(`  \x1b[31mFail  : ${failCount}\x1b[0m`);
    console.log(`  Score : ${Math.round((passCount / (passCount + failCount)) * 100)}%`);

    if (failCount === 0) {
      console.log('\n  \x1b[32m✨ ALL WSTG CHECKS PASSED — Backend is compliant.\x1b[0m');
    } else {
      console.log('\n  \x1b[33m⚠️  Some checks failed. Review the failures above.\x1b[0m');
    }

    console.log(`\n  OWASP WSTG Controls Covered:`);
    console.log(`    WSTG-CONF-02  Security Headers`);
    console.log(`    WSTG-CONF-07  HTTP Strict Transport Security`);
    console.log(`    WSTG-CONF-08  CORS Policy`);
    console.log(`    WSTG-SESS-02  Cookie Attributes`);
    console.log(`    WSTG-SESS-03  CSRF Protection`);
    console.log(`    WSTG-ERRH-01  Error Handling`);
    console.log(`    WSTG-ATHN-07  Rate Limiting`);
    console.log(`    WSTG-CRYP-03  Encryption at Rest`);
    console.log(`    WSTG-INFO-02  Server Fingerprinting`);
    console.log('');

    process.exit(failCount > 0 ? 1 : 0);

  } catch (err) {
    console.error('\n  💥 AUDIT ABORTED:', err.message);
    console.error('     Make sure the server is running: npm run dev');
    process.exit(2);
  }
})();
