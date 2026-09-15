const http = require('http');
const https = require('https');
const { URL } = require('url');
const { siteMetadata } = require('../gatsby-config');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const SITE_CHECKS = [
  { path: '/', contentType: 'text/html', contains: 'id="hero-title"' },
  { path: '/resume.pdf', contentType: 'application/pdf' },
  { path: '/og.png', contentType: 'image/png' },
  { path: '/playground/', contentType: 'text/html', contains: 'id="playground-title"' },
  {
    path: '/playground/liquid-typography/',
    contentType: 'text/html',
    contains: 'id="liquid-typography-title"',
  },
  { path: '/loanlens', contentType: 'text/html', contains: 'data-storage="browser"' },
  { path: '/loanlens/', contentType: 'text/html', contains: 'data-storage="browser"' },
];

function validateCertificate(certificate, hostname, minimumDays = 14, now = Date.now()) {
  const expires = Date.parse(certificate?.valid_to);
  if (!Number.isFinite(expires)) {
    throw new Error(`Cannot determine TLS certificate expiry for ${hostname}`);
  }

  const daysRemaining = (expires - now) / DAY_MS;
  if (daysRemaining < minimumDays) {
    throw new Error(
      `TLS certificate for ${hostname} expires on ${new Date(expires).toISOString()}; ` +
        `at least ${minimumDays} days of validity are required`,
    );
  }

  return daysRemaining;
}

function readResponse(url, collectText, timeoutMs) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.get(
      url,
      { headers: { 'User-Agent': 'Portfolio-Health-Check' } },
      res => {
        const certificate = url.protocol === 'https:' ? res.socket.getPeerCertificate() : null;
        const chunks = [];
        let size = 0;

        res.on('error', reject);
        res.on('data', chunk => {
          if (collectText) {
            size += chunk.length;
            if (size > MAX_HTML_BYTES) {
              request.destroy(new Error(`HTML response exceeds 2 MB: ${url.href}`));
              return;
            }
            chunks.push(chunk);
          }
        });
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
            certificate,
          }),
        );
      },
    );

    const timeout = setTimeout(
      () => request.destroy(new Error(`Request timed out after ${timeoutMs}ms: ${url.href}`)),
      timeoutMs,
    );
    request.on('error', reject);
    request.on('close', () => clearTimeout(timeout));
  });
}

async function checkUrl(
  input,
  expected,
  { minimumCertificateDays = 14, timeoutMs = 15000, redirectsRemaining = 3 } = {},
) {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }

  const response = await readResponse(url, Boolean(expected.contains), timeoutMs);
  if (url.protocol === 'https:') {
    validateCertificate(response.certificate, url.hostname, minimumCertificateDays);
  }

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (!response.headers.location || redirectsRemaining === 0) {
      throw new Error(`Invalid or excessive redirects: ${url.href}`);
    }
    const destination = new URL(response.headers.location, url);
    if (url.protocol === 'https:' && destination.protocol !== 'https:') {
      throw new Error(`Refusing an HTTPS downgrade: ${url.href} -> ${destination.href}`);
    }
    return checkUrl(destination, expected, {
      minimumCertificateDays,
      timeoutMs,
      redirectsRemaining: redirectsRemaining - 1,
    });
  }

  if (response.status !== 200) {
    throw new Error(`Expected HTTP 200, received ${response.status}: ${url.href}`);
  }

  const contentType = (response.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (contentType !== expected.contentType) {
    throw new Error(
      `Expected ${expected.contentType}, received ${contentType || 'no Content-Type'}: ${url.href}`,
    );
  }
  if (expected.contains && !response.body.includes(expected.contains)) {
    throw new Error(`Expected page content is missing (possible routing fallback): ${url.href}`);
  }

  return { url: url.href, contentType };
}

async function checkSite(baseUrl = siteMetadata.siteUrl, { portfolioOnly = false } = {}) {
  const checks = portfolioOnly
    ? SITE_CHECKS.filter(check => !['/loanlens', '/loanlens/'].includes(check.path))
    : SITE_CHECKS;
  for (const check of checks) {
    const result = await checkUrl(new URL(check.path, baseUrl), check);
    process.stdout.write(`OK ${result.url} (${result.contentType})\n`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const portfolioOnly = args.includes('--portfolio-only');
  const positional = args.filter(arg => arg !== '--portfolio-only');
  if (positional.length > 1 || positional.some(arg => arg.startsWith('-'))) {
    console.error('Usage: node scripts/check-site.js [base-url] [--portfolio-only]');
    process.exitCode = 1;
  } else {
    checkSite(positional[0], { portfolioOnly }).catch(error => {
      console.error(`Site health check failed: ${error.message}`);
      process.exitCode = 1;
    });
  }
}

module.exports = { checkSite, checkUrl, validateCertificate };
