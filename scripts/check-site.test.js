const assert = require('node:assert/strict');
const { test } = require('node:test');
const http = require('http');
const { checkUrl, validateCertificate } = require('./check-site');

async function serve(t, handler) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise(resolve => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  return `http://127.0.0.1:${server.address().port}`;
}

test('accepts a certificate with at least fourteen days remaining', () => {
  const now = Date.parse('2026-01-01T00:00:00Z');
  const certificate = { valid_to: '2026-01-15T00:00:00Z' };
  assert.equal(validateCertificate(certificate, 'example.com', 14, now), 14);
});

test('rejects an expiring certificate before it blocks visitors', () => {
  assert.throws(
    () =>
      validateCertificate(
        { valid_to: '2026-01-14T00:00:00Z' },
        'example.com',
        14,
        Date.parse('2026-01-01T00:00:00Z'),
      ),
    /at least 14 days/,
  );
});

test('rejects expired and unreadable certificates', () => {
  assert.throws(
    () => validateCertificate({ valid_to: '2020-01-01' }, 'example.com'),
    /at least 14 days/,
  );
  assert.throws(() => validateCertificate({}, 'example.com'), /Cannot determine TLS/);
  assert.throws(() => validateCertificate(null, 'example.com'), /Cannot determine TLS/);
});

test('accepts the expected page and Content-Type with a charset', async t => {
  const base = await serve(t, (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1 id="hero-title">Portfolio</h1>');
  });
  const result = await checkUrl(base, { contentType: 'text/html', contains: 'id="hero-title"' });
  assert.equal(result.contentType, 'text/html');
});

test('rejects an unsuccessful HTTP status', async t => {
  const base = await serve(t, (_req, res) => {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('Not found');
  });
  await assert.rejects(checkUrl(base, { contentType: 'text/html' }), /received 404/);
});

test('rejects HTML served in place of the resume PDF', async t => {
  const base = await serve(t, (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('SPA fallback');
  });
  await assert.rejects(
    checkUrl(base, { contentType: 'application/pdf' }),
    /Expected application\/pdf/,
  );
});

test('rejects an HTML routing fallback for the wrong page', async t => {
  const base = await serve(t, (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1 id="hero-title">Portfolio</h1>');
  });
  await assert.rejects(
    checkUrl(base, { contentType: 'text/html', contains: 'id="playground-title"' }),
    /possible routing fallback/,
  );
});

test('follows a relative redirect and validates its destination', async t => {
  const base = await serve(t, (req, res) => {
    if (req.url === '/') {
      res.writeHead(302, { Location: '/resume.pdf' });
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/pdf' });
    res.end('%PDF-1.7');
  });
  const result = await checkUrl(base, { contentType: 'application/pdf' });
  assert.equal(result.url, `${base}/resume.pdf`);
});

test('rejects redirect loops', async t => {
  const base = await serve(t, (_req, res) => {
    res.writeHead(301, { Location: '/' });
    res.end();
  });
  await assert.rejects(checkUrl(base, { contentType: 'text/html' }), /excessive redirects/);
});

test('times out an unresponsive endpoint', async t => {
  const base = await serve(t, () => {});
  await assert.rejects(
    checkUrl(base, { contentType: 'text/html' }, { timeoutMs: 50 }),
    /Request timed out/,
  );
});

test('rejects unsupported URL protocols', async () => {
  await assert.rejects(
    checkUrl('file:///tmp/resume.pdf', { contentType: 'application/pdf' }),
    /Unsupported URL protocol/,
  );
});
