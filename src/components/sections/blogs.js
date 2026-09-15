import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Icon } from '@components/icons';
import { fetchMediumFeed, MEDIUM_PROFILE_URL, selectMediumImage } from '@utils/mediumFeed';

const StyledBlogsSection = styled.section`
  .numbered-heading {
    margin-bottom: 48px;
  }

  .feed-message {
    max-width: 620px;
    color: var(--text);
    font-size: var(--fz-lg);
  }

  .feed-retry {
    ${({ theme }) => theme.mixins.smallButton};
    margin-top: 16px;
  }

  .medium-link {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-top: 34px;
    color: var(--ink);
    font-size: var(--fz-sm);
    font-weight: 600;

    svg {
      width: 17px;
      height: 17px;
      color: var(--warm);
      transition: transform 0.2s var(--easing);
    }

    &:hover,
    &:focus-visible {
      color: var(--accent);

      svg {
        transform: translate(2px, -2px);
      }
    }
  }
`;

const StyledArticleList = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  padding: 0;
  margin: 0;
  list-style: none;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StyledArticle = styled.li`
  min-width: 0;

  a {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--surface);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    color: inherit;
    box-shadow: var(--shadow-sm);
    transition: transform 0.25s var(--easing), box-shadow 0.25s var(--easing),
      border-color 0.25s var(--easing);

    &:hover,
    &:focus-visible {
      color: inherit;
      border-color: var(--accent);
      box-shadow: var(--shadow-md);
      transform: translateY(-4px);

      .article-image {
        filter: saturate(1);
        transform: scale(1.025);
      }

      .article-title {
        color: var(--accent);
      }
    }
  }

  .article-image-wrap {
    aspect-ratio: 3 / 2;
    overflow: hidden;
    background: var(--paper-2);
    border-bottom: 1px solid var(--line);
  }

  .article-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.88);
    transition: transform 0.4s var(--easing), filter 0.4s var(--easing);
  }

  .article-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 22px;
  }

  &.text-only .article-body {
    justify-content: center;
    min-height: 240px;
  }

  .article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin-bottom: 14px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    text-transform: uppercase;
  }

  .article-title {
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 25px;
    font-weight: 600;
    line-height: 1.15;
    overflow-wrap: anywhere;
    transition: color 0.2s var(--easing);
  }
`;

const Blogs = () => {
  const [feed, setFeed] = useState({ status: 'idle', articles: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let timedOut = false;
    setFeed({ status: 'loading', articles: [] });

    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    const load = async () => {
      try {
        const items = await fetchMediumFeed({ signal: controller.signal });
        if (cancelled) {
          return;
        }

        const articles = items.map(({ html, imageSources, ...article }) => {
          let image = selectMediumImage(imageSources, article.url);
          if (!image && html) {
            // Template contents stay inert; only image URLs are extracted, never feed HTML.
            const template = document.createElement('template');
            template.innerHTML = html;
            const sources = [...template.content.querySelectorAll('img')].map(element =>
              element.getAttribute('src'),
            );
            image = selectMediumImage(sources, article.url);
          }
          return { ...article, image };
        });
        setFeed({ status: articles.length ? 'loaded' : 'empty', articles });
      } catch (error) {
        if (!cancelled) {
          console.error('Unable to load the Medium feed:', error);
          setFeed({ status: 'error', articles: [], timedOut });
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };

    load();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  const hideFailedImage = (url, image) => {
    console.warn('Unable to load a Medium article image:', image);
    setFeed(current => ({
      ...current,
      articles: current.articles.map(article =>
        article.url === url && article.image === image ? { ...article, image: null } : article,
      ),
    }));
  };

  return (
    <StyledBlogsSection id="blogs">
      <h2 className="numbered-heading">Writing</h2>

      {feed.status === 'loading' && (
        <p className="feed-message" role="status">
          Loading articles from Medium...
        </p>
      )}
      {feed.status === 'error' && (
        <div className="feed-message" role="alert">
          <p>
            {feed.timedOut
              ? 'The Medium feed is taking too long to respond.'
              : 'Could not load the Medium feed.'}{' '}
            Try again or read the articles directly on Medium.
          </p>
          <button
            className="feed-retry"
            type="button"
            onClick={() => setAttempt(value => value + 1)}>
            Try again
          </button>
        </div>
      )}
      {feed.status === 'empty' && (
        <p className="feed-message" role="status">
          No articles were returned by the Medium feed. You can still visit the profile below.
        </p>
      )}
      <div aria-busy={feed.status === 'loading'}>
        {feed.status === 'loaded' && (
          <StyledArticleList aria-label="Articles from Medium">
            {feed.articles.map(({ title, url, date, dateTime, image }) => (
              <StyledArticle key={url} className={image ? undefined : 'text-only'}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {image && (
                    <span className="article-image-wrap">
                      <img
                        className="article-image"
                        src={image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={() => hideFailedImage(url, image)}
                      />
                    </span>
                  )}
                  <div className="article-body">
                    <span className="article-meta">
                      <time dateTime={dateTime}>{date}</time>
                    </span>
                    <h3 className="article-title">{title}</h3>
                  </div>
                </a>
              </StyledArticle>
            ))}
          </StyledArticleList>
        )}
      </div>

      <noscript>Read the articles directly on Medium using the link below.</noscript>
      <a
        className="medium-link"
        href={MEDIUM_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer">
        All articles on Medium <Icon name="External" />
      </a>
    </StyledBlogsSection>
  );
};

export default Blogs;
