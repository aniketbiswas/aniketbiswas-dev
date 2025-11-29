import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { srConfig } from '@config';
import sr from '@utils/sr';
import { usePrefersReducedMotion } from '@hooks';

const StyledBlogsSection = styled.section`
  max-width: 1000px;

  .blogs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-gap: 25px;
    margin-top: 50px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
`;

const StyledBlog = styled.article`
  cursor: pointer;
  transition: var(--transition);

  &:hover,
  &:focus {
    transform: translateY(-5px);

    .blog-inner {
      box-shadow: 0 20px 30px -15px var(--navy-shadow);
    }
  }

  .blog-inner {
    ${({ theme }) => theme.mixins.boxShadow};
    ${({ theme }) => theme.mixins.flexBetween};
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    height: 100%;
    padding: 2rem 1.75rem;
    border-radius: var(--border-radius);
    background-color: var(--light-navy);
    transition: var(--transition);
  }

  .blog-inner {
    ${({ theme }) => theme.mixins.boxShadow};
    ${({ theme }) => theme.mixins.flexBetween};
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    height: 100%;
    padding: 2rem 1.75rem;
    border-radius: var(--border-radius);
    background-color: var(--light-navy);
    transition: var(--transition);
  }

  .blog-title {
    margin: 0 0 10px 0;
    color: var(--lightest-slate);
    font-size: var(--fz-xxl);

    a {
      ${({ theme }) => theme.mixins.inlineLink};
    }
  }

  .blog-description {
    color: var(--light-slate);
    font-size: 17px;
  }

  .blog-date {
    color: var(--light-slate);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    margin-top: 20px;
  }

  .blog-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: var(--border-radius);
    margin-bottom: 20px;
  }

  .loading {
    color: var(--light-slate);
    font-style: italic;
  }
`;

const Blogs = () => {
  const revealContainer = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Medium username for RSS feed
  const mediumUsername = 'aniketbiswas';

  // Fallback data in case fetching fails
  const fallbackArticles = [
    {
      title: 'Dirty Room Theory',
      description:
        'An interesting perspective on software development practices and how small inefficiencies can compound over time, drawing parallels between maintaining clean code and keeping a tidy workspace.',
      url: 'https://medium.com/@aniketbiswas/dirty-room-theory-4fb1f0b48bc6',
      publishDate: 'Published on Medium',
      image: null,
    },
    {
      title: 'Ship of Theseus and Software Development',
      description:
        'Exploring the philosophical paradox of the Ship of Theseus through the lens of software development, examining how applications evolve and transform while maintaining their core identity.',
      url: 'https://medium.com/@aniketbiswas/ship-of-theseus-and-software-development-3579a1d05eaa',
      publishDate: 'Published on Medium',
      image: null,
    },
    {
      title: 'My Internship Experience: Learning, Fun, Hard Goodbyes',
      description:
        'A personal reflection on my internship journey, sharing insights about the learning process, memorable experiences, and the emotional aspects of transitioning from internship to full-time roles.',
      url: 'https://medium.com/@aniketbiswas/my-internship-experience-learning-fun-hard-goodbyes-d9cc64e3213e',
      publishDate: 'Published on Medium',
      image: null,
    },
  ];

  useEffect(() => {
    const fetchRssFeed = async () => {
      setLoading(true);
      try {
        // Use RSS2JSON service to convert Medium RSS feed to JSON
        const response = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${mediumUsername}`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch RSS feed');
        }

        const data = await response.json();

        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const mediumPosts = data.items.map(item => {
            // Extract description without HTML tags
            let cleanDescription = '';
            if (typeof document !== 'undefined') {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = item.description || '';
              cleanDescription = tempDiv.textContent || tempDiv.innerText || '';
            } else {
              // SSR fallback - simple regex to remove HTML tags
              cleanDescription = (item.description || '').replace(/<[^>]*>/g, '');
            }
            const truncatedDescription = `${cleanDescription.substring(0, 150)  }...`;

            // Extract image from content if thumbnail is empty
            let imageUrl = item.thumbnail;
            if ((!imageUrl || imageUrl === '') && typeof document !== 'undefined') {
              const contentDiv = document.createElement('div');
              contentDiv.innerHTML = item.content || item.description || '';
              const firstImage = contentDiv.querySelector('img');
              if (firstImage && firstImage.src && !firstImage.src.includes('medium.com/_/stat')) {
                imageUrl = firstImage.src;
              }
            }

            return {
              title: item.title,
              description: truncatedDescription,
              url: item.link,
              publishDate: new Date(item.pubDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
              image: imageUrl || null,
            };
          });

          setArticles(mediumPosts);
        } else {
          throw new Error('Invalid RSS feed response');
        }
      } catch (error) {
        console.error('Error fetching Medium articles:', error);
        // Fall back to hardcoded data if fetch fails
        setArticles(fallbackArticles);
      } finally {
        setLoading(false);
      }
    };

    fetchRssFeed();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    sr.reveal(revealContainer.current, srConfig());
  }, []);

  return (
    <StyledBlogsSection id="blogs" ref={revealContainer}>
      <h2 className="numbered-heading">Some Things I've Written</h2>

      {loading ? (
        <div className="loading">Loading articles...</div>
      ) : (
        <div className="blogs-grid">
          {articles.map((article, i) => (
            <StyledBlog key={i}>
              <div className="blog-inner">
                <header>
                  {article.image && (
                    <img src={article.image} alt={article.title} className="blog-image" />
                  )}

                  <h3 className="blog-title">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h3>

                  <div className="blog-description">
                    <p>{article.description}</p>
                  </div>
                </header>

                <footer>
                  <div className="blog-date">{article.publishDate}</div>
                </footer>
              </div>
            </StyledBlog>
          ))}
        </div>
      )}
    </StyledBlogsSection>
  );
};

export default Blogs;
