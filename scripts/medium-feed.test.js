const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  MEDIUM_FEED_URL,
  MEDIUM_FEED_ENDPOINT,
  parseMediumFeed,
  selectMediumImage,
  fetchMediumFeed,
} = require('../src/utils/mediumFeed');

const article = overrides => ({
  title: 'A published article',
  link: 'https://medium.com/@aniketbiswas/a-published-article',
  pubDate: '2026-06-25 21:30:48',
  thumbnail: '',
  content: '<p>Original article content.</p>',
  ...overrides,
});

const feed = items => ({
  status: 'ok',
  feed: { url: MEDIUM_FEED_URL },
  items,
});

test('keeps all returned articles in feed order without inventing summaries or reading times', () => {
  const items = Array.from({ length: 12 }, (_, index) =>
    article({
      title: `Published title ${index}`,
      link: `https://medium.com/@aniketbiswas/article-${index}`,
    }),
  );
  const result = parseMediumFeed(feed(items));
  assert.equal(result.length, 12);
  assert.deepEqual(
    result.map(item => item.title),
    items.map(item => item.title),
  );
  assert(result.every(item => !('description' in item) && !('readTime' in item)));
});

test('preserves the provided calendar date without interpreting an unspecified timezone', () => {
  const [result] = parseMediumFeed(feed([article({ pubDate: '2026-06-25 23:59:59' })]));
  assert.equal(result.dateTime, '2026-06-25');
  assert.equal(result.date, 'Jun 25, 2026');
});

test('accepts an empty feed as a genuine empty state', () => {
  assert.deepEqual(parseMediumFeed(feed([])), []);
});

test('rejects provider failures, wrong feeds, and malformed item collections', () => {
  assert.throws(() => parseMediumFeed({ status: 'error' }), /unexpected response/);
  assert.throws(
    () => parseMediumFeed({ ...feed([]), feed: { url: 'https://medium.com/feed/@someone-else' } }),
    /unexpected response/,
  );
  assert.throws(() => parseMediumFeed(feed(null)), /unexpected response/);
});

test('rejects missing article information instead of rendering placeholder claims', () => {
  for (const invalid of [
    null,
    article({ title: '' }),
    article({ link: null }),
    article({ pubDate: null }),
  ]) {
    assert.throws(() => parseMediumFeed(feed([invalid])), /missing required information/);
  }
});

test('rejects unsafe article URLs', () => {
  for (const link of [
    'javascript:alert(1)',
    'http://medium.com/post',
    'https://user:password@medium.com/post',
  ]) {
    assert.throws(() => parseMediumFeed(feed([article({ link })])), /unsupported link/);
  }
  assert.throws(() => parseMediumFeed(feed([article({ link: 'not a URL' })])), TypeError);
});

test('rejects impossible or malformed publication dates', () => {
  for (const pubDate of ['not a date', '2026-02-30 12:00:00', '2025-02-29 12:00:00']) {
    assert.throws(() => parseMediumFeed(feed([article({ pubDate })])), /invalid publication date/);
  }
  assert.equal(
    parseMediumFeed(feed([article({ pubDate: '2024-02-29 12:00:00' })]))[0].dateTime,
    '2024-02-29',
  );
});

test('ignores tracking pixels and selects a real cover image', () => {
  const image = selectMediumImage(
    [
      '',
      undefined,
      'https://medium.com/_/stat?event=post.clientViewed',
      '//cdn-images-1.medium.com/max/1024/cover.png',
    ],
    article().link,
  );
  assert.equal(image, 'https://cdn-images-1.medium.com/max/1024/cover.png');
});

test('supports articles without cover images', () => {
  assert.equal(selectMediumImage([], article().link), null);
  assert.equal(
    selectMediumImage(['https://medium.com/_/stat?event=post.clientViewed'], article().link),
    null,
  );
});

test('logs and rejects malformed or unsafe optional image URLs', t => {
  const warning = t.mock.method(console, 'warn', () => {});
  const image = selectMediumImage(
    [42, 'http://[', 'javascript:alert(1)', 'https://user:password@example.com/image.png'],
    article().link,
  );
  assert.equal(image, null);
  assert.equal(warning.mock.callCount(), 4);
});

test('passes cancellation and omits credentials when requesting the public feed', async () => {
  const controller = new AbortController();
  let requestedUrl;
  let requestedOptions;
  const result = await fetchMediumFeed({
    signal: controller.signal,
    request: async (url, options) => {
      requestedUrl = url;
      requestedOptions = options;
      return new Response(JSON.stringify(feed([article()])), { status: 200 });
    },
  });
  assert.equal(requestedUrl, MEDIUM_FEED_ENDPOINT);
  assert.equal(new URL(requestedUrl).searchParams.get('rss_url'), MEDIUM_FEED_URL);
  assert.equal(requestedOptions.signal, controller.signal);
  assert.equal(requestedOptions.credentials, 'omit');
  assert.equal(result.length, 1);
});

test('surfaces HTTP and JSON failures', async () => {
  await assert.rejects(
    fetchMediumFeed({ request: async () => new Response('Unavailable', { status: 503 }) }),
    /HTTP 503/,
  );
  await assert.rejects(
    fetchMediumFeed({ request: async () => new Response('Not JSON', { status: 200 }) }),
    SyntaxError,
  );
});

test('propagates request cancellation to the owning component', async () => {
  const aborted = new DOMException('Request cancelled', 'AbortError');
  await assert.rejects(
    fetchMediumFeed({
      request: async () => {
        throw aborted;
      },
    }),
    error => error === aborted,
  );
});
