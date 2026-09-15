import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';
import styled from 'styled-components';
import { Icon } from '@components/icons';

const StyledProjectsSection = styled.section``;

const StyledProjectsList = styled.ol`
  padding: 0;
  margin: 0;
  list-style: none;
  border-top: 1px solid var(--line-strong);
`;

const StyledProject = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(300px, 0.92fr);
  gap: 56px;
  align-items: center;
  padding: 56px 0;
  border-bottom: 1px solid var(--line-strong);

  @media (max-width: 900px) {
    gap: 36px;
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 38px 0 44px;
  }

  .project-media {
    position: relative;
    min-width: 0;

    > .project-image {
      border: 1px solid var(--ink);
    }
  }

  .project-image-link {
    display: block;
    overflow: hidden;
    background: var(--paper-2);
    border: 1px solid var(--ink);

    &:after {
      content: '';
      position: absolute;
      inset: 8px -8px -8px 8px;
      z-index: -1;
      background: ${({ index }) => (index % 2 === 0 ? 'var(--accent)' : 'var(--warm)')};
      transition: transform 0.3s var(--easing);
    }

    &:hover,
    &:focus-visible {
      color: inherit;

      &:after {
        transform: translate(3px, 3px);
      }

      .project-image {
        transform: scale(1.02);
        filter: saturate(1);
      }
    }
  }

  .project-image {
    aspect-ratio: 16 / 10;
    width: 100%;
    filter: saturate(0.78) contrast(1.02);
    transition: transform 0.45s var(--easing), filter 0.45s var(--easing);

    img {
      object-fit: cover !important;
    }
  }

  .project-fallback {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    aspect-ratio: 16 / 10;
    padding: 28px;
    overflow: hidden;
    background-color: #dfe6f7;
    background-image: linear-gradient(rgba(23, 25, 31, 0.09) 1px, transparent 1px),
      linear-gradient(90deg, rgba(23, 25, 31, 0.09) 1px, transparent 1px);
    background-size: 38px 38px;
    border: 1px solid var(--ink);
    color: var(--ink);

    @media (max-width: 480px) {
      padding: 22px;
    }
  }

  .fallback-label,
  .fallback-coordinates {
    position: relative;
    z-index: 2;
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    font-weight: 600;
    text-transform: uppercase;
  }

  .fallback-label {
    color: var(--accent-strong);
  }

  .fallback-coordinates {
    align-self: flex-end;
    color: var(--text);
  }

  .fallback-mark {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 94px;
    height: 94px;
    transform: translate(-50%, -54%) rotate(45deg);
    background: var(--warm);
    border: 2px solid var(--ink);
    border-radius: 50% 50% 50% 8px;

    &:after {
      content: '';
      position: absolute;
      top: 24px;
      left: 24px;
      width: 42px;
      height: 42px;
      background: var(--surface);
      border: 2px solid var(--ink);
      border-radius: 50%;
    }

    @media (max-width: 480px) {
      width: 74px;
      height: 74px;

      &:after {
        top: 19px;
        left: 19px;
        width: 32px;
        height: 32px;
      }
    }
  }

  .project-content {
    min-width: 0;
  }

  .project-index {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 14px;
    color: var(--accent-strong);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    font-weight: 600;
    text-transform: uppercase;

    &:after {
      content: '';
      width: 32px;
      height: 1px;
      background: var(--warm);
    }
  }

  .project-title {
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 38px;
    font-weight: 600;
    line-height: 1;

    @media (max-width: 768px) {
      font-size: 32px;
    }

    a {
      color: inherit;

      &:hover,
      &:focus-visible {
        color: var(--accent);
      }
    }
  }

  .project-description {
    margin-top: 20px;
    color: var(--text);
    font-size: var(--fz-md);
    line-height: 1.65;

    p {
      margin: 0;

      + p {
        margin-top: 12px;
      }
    }

    strong {
      color: var(--ink-soft);
    }
  }

  .project-tech-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    padding: 18px 0 0;
    margin: 22px 0 0;
    border-top: 1px solid var(--line);
    list-style: none;

    li {
      position: relative;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: var(--fz-xs);

      &:not(:last-child):after {
        content: '/';
        position: absolute;
        right: -12px;
        color: var(--warm);
      }
    }
  }

  .project-links {
    display: flex;
    flex-wrap: wrap;
    gap: 14px 24px;
    margin-top: 26px;

    &:empty {
      display: none;
    }

    a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      padding: 10px 0;
      border-bottom: 1px solid var(--line-strong);
      color: var(--ink-soft);
      font-size: var(--fz-sm);
      font-weight: 600;

      &:hover,
      &:focus-visible {
        border-color: var(--accent);
        color: var(--accent-strong);

        svg {
          transform: translate(2px, -2px);
        }
      }

      svg {
        width: 16px;
        height: 16px;
        transition: transform 0.2s var(--easing);
      }
    }
  }
`;

const Featured = () => {
  const data = useStaticQuery(graphql`
    {
      featured: allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/featured/" } }
        sort: { fields: [frontmatter___priority], order: ASC }
      ) {
        edges {
          node {
            frontmatter {
              title
              cover {
                childImageSharp {
                  gatsbyImageData(
                    width: 900
                    height: 560
                    placeholder: DOMINANT_COLOR
                    formats: [AUTO, WEBP]
                    quality: 92
                  )
                }
              }
              tech
              github
              external
              cta
            }
            html
          }
        }
      }
    }
  `);

  const projects = data.featured.edges.filter(({ node }) => node);

  return (
    <StyledProjectsSection id="projects">
      <h2 className="numbered-heading">Some things I’ve built</h2>

      <StyledProjectsList>
        {projects.map(({ node }, index) => {
          const { frontmatter, html } = node;
          const { external, title, tech, github, cover, cta } = frontmatter;
          const image = cover ? getImage(cover) : null;
          const primaryUrl = external || github || cta;
          let primaryLabel = `Read ${title} case study`;
          if (external) {
            primaryLabel = `Open ${title} demo`;
          } else if (github) {
            primaryLabel = `View ${title} source on GitHub`;
          }

          return (
            <StyledProject key={title} index={index}>
              <div className="project-media">
                {primaryUrl ? (
                  <a
                    className="project-image-link"
                    href={primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={primaryLabel}>
                    {image ? (
                      <GatsbyImage
                        image={image}
                        alt={`${title} interface`}
                        className="project-image"
                      />
                    ) : (
                      <div
                        className="project-fallback"
                        role="img"
                        aria-label={`${title}, decentralized geo-tagged media project`}>
                        <span className="fallback-label">Ethereum / IPFS</span>
                        <span className="fallback-mark" aria-hidden="true" />
                        <span className="fallback-coordinates">Geo-tagged media sharing</span>
                      </div>
                    )}
                  </a>
                ) : (
                  image && (
                    <GatsbyImage
                      image={image}
                      alt={`${title} interface`}
                      className="project-image"
                    />
                  )
                )}
              </div>

              <article className="project-content">
                <p className="project-index">Project {String(index + 1).padStart(2, '0')}</p>
                <h3 className="project-title">
                  {primaryUrl ? (
                    <a href={primaryUrl} target="_blank" rel="noopener noreferrer">
                      {title}
                    </a>
                  ) : (
                    title
                  )}
                </h3>
                <div className="project-description" dangerouslySetInnerHTML={{ __html: html }} />

                {tech && tech.length > 0 && (
                  <ul className="project-tech-list" aria-label={`${title} technologies`}>
                    {tech.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}

                <div className="project-links">
                  {external && (
                    <a
                      href={external}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${title} demo`}>
                      Open demo <Icon name="External" />
                    </a>
                  )}
                  {github && (
                    <a
                      href={github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${title} source on GitHub`}>
                      View source <Icon name="GitHub" />
                    </a>
                  )}
                  {cta && (
                    <a
                      href={cta}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Read ${title} case study`}>
                      Read case study <Icon name="External" />
                    </a>
                  )}
                </div>
              </article>
            </StyledProject>
          );
        })}
      </StyledProjectsList>
    </StyledProjectsSection>
  );
};

export default Featured;
