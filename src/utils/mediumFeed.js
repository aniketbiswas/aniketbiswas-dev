const { mediumUsername } = require('../config');

const MEDIUM_PROFILE_URL = `https://medium.com/@${encodeURIComponent(mediumUsername)}`;
const MEDIUM_FEED_URL = `https://medium.com/feed/@${encodeURIComponent(mediumUsername)}`;
const MEDIUM_FEED_ENDPOINT = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
  MEDIUM_FEED_URL,
)}`;

function parseMediumFeed(data) {
  if (
    !data ||
    data.status !== 'ok' ||
    data.feed?.url !== MEDIUM_FEED_URL ||
    !Array.isArray(data.items)
  ) {
    throw new Error('The Medium feed returned an unexpected response.');
  }

  return data.items.map((item, index) => {
    if (
      !item ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      typeof item.link !== 'string' ||
      typeof item.pubDate !== 'string'
    ) {
      throw new Error(`Medium feed article ${index + 1} is missing required information.`);
    }

    const url = new URL(item.link);
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error(`Medium feed article ${index + 1} has an unsupported link.`);
    }

    // Preserve the feed's calendar date rather than shifting it to the visitor's timezone.
    const dateTime = item.pubDate.match(/^\d{4}-\d{2}-\d{2}(?=[ T]|$)/)?.[0];
    const publishedDate = new Date(`${dateTime}T00:00:00Z`);
    if (
      !dateTime ||
      !Number.isFinite(publishedDate.getTime()) ||
      publishedDate.toISOString().slice(0, 10) !== dateTime
    ) {
      throw new Error(`Medium feed article ${index + 1} has an invalid publication date.`);
    }

    const html = item.content || item.description || '';
    if (typeof html !== 'string') {
      throw new Error(`Medium feed article ${index + 1} has invalid content.`);
    }

    return {
      title: item.title.trim(),
      url: url.href,
      dateTime,
      date: publishedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }),
      imageSources: [item.thumbnail, item.enclosure?.link],
      html,
    };
  });
}

function selectMediumImage(sources, articleUrl) {
  for (const source of sources) {
    if (!source) {
      continue;
    }
    if (typeof source !== 'string') {
      console.warn('Ignoring a malformed Medium feed image.');
      continue;
    }

    let url;
    try {
      url = new URL(source, articleUrl);
    } catch (error) {
      if (!(error instanceof TypeError)) {
        throw error;
      }
      console.warn('Ignoring a malformed Medium feed image URL.');
      continue;
    }

    if (url.hostname === 'medium.com' && url.pathname === '/_/stat') {
      continue;
    }
    if (url.protocol !== 'https:' || url.username || url.password) {
      console.warn('Ignoring an unsupported Medium feed image URL.');
      continue;
    }

    return url.href;
  }
  return null;
}

async function fetchMediumFeed({ signal, request = fetch } = {}) {
  const response = await request(MEDIUM_FEED_ENDPOINT, {
    signal,
    credentials: 'omit',
  });
  if (!response.ok) {
    throw new Error(`The Medium feed request failed (HTTP ${response.status}).`);
  }
  return parseMediumFeed(await response.json());
}

module.exports = {
  MEDIUM_PROFILE_URL,
  MEDIUM_FEED_URL,
  MEDIUM_FEED_ENDPOINT,
  parseMediumFeed,
  selectMediumImage,
  fetchMediumFeed,
};
