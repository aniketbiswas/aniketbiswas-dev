import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import styled from 'styled-components';

const StyledJobsSection = styled.section`
  .earlier-experience {
    margin-top: 20px;

    summary {
      padding: 18px 0;
      color: var(--ink-soft);
      font-size: var(--fz-lg);
      font-weight: 600;
      cursor: pointer;

      &::marker {
        color: var(--accent);
      }

      span {
        margin-left: 12px;
        color: var(--text-muted);
        font-family: var(--font-mono);
        font-size: var(--fz-xs);
        font-weight: 400;
      }
    }
  }
`;

const StyledTimeline = styled.ol`
  padding: 0;
  margin: 0;
  list-style: none;
  border-top: 1px solid var(--line-strong);
`;

const StyledRole = styled.li`
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 42px;
  padding: 44px 0 48px;
  border-bottom: 1px solid var(--line-strong);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 34px 0 38px;
  }

  .role-meta {
    padding-top: 4px;
  }

  .role-range {
    margin: 0;
    color: var(--accent-strong);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    font-weight: 600;
    line-height: 1.5;
    text-transform: uppercase;
  }

  .role-location {
    margin: 8px 0 0;
    color: var(--text-muted);
    font-size: var(--fz-sm);
  }

  .role-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 10px;
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 30px;
    font-weight: 600;
    line-height: 1.05;

    @media (max-width: 600px) {
      font-size: 27px;
    }
  }

  .role-team {
    margin: 8px 0 0;
    color: var(--text-muted);
    font-size: var(--fz-sm);
    line-height: 1.5;
  }

  .company {
    color: var(--text-muted);
    font-family: var(--font-serif);
    font-size: 23px;
    font-style: italic;
    font-weight: 400;

    &:before {
      content: 'at';
      margin-right: 5px;
      color: var(--warm-strong);
      font-family: var(--font-sans);
      font-size: var(--fz-md);
      font-style: normal;
      font-weight: 600;
    }

    a {
      color: inherit;

      &:hover,
      &:focus-visible {
        color: var(--accent);
      }
    }
  }

  .role-details {
    margin-top: 22px;

    ul {
      display: grid;
      gap: 11px;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    li {
      position: relative;
      padding-left: 24px;
      color: var(--text);
      font-size: var(--fz-md);
      line-height: 1.55;

      &:before {
        content: '';
        position: absolute;
        top: 0.68em;
        left: 0;
        width: 10px;
        height: 2px;
        background: var(--accent);
      }
    }
  }
`;

const Jobs = () => {
  const data = useStaticQuery(graphql`
    query {
      jobs: allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/jobs/" } }
        sort: { fields: [frontmatter___endDate], order: DESC }
      ) {
        edges {
          node {
            frontmatter {
              title
              company
              currentTeam
              location
              range
              url
              endDate
            }
            html
          }
        }
      }
    }
  `);

  const roles = data.jobs.edges.map(({ node }) => {
    const { frontmatter, html } = node;
    const { title, url, company, range, location, currentTeam } = frontmatter;

    return (
      <StyledRole key={`${company}-${title}`}>
        <div className="role-meta">
          <p className="role-range">{range}</p>
          {location && <p className="role-location">{location}</p>}
        </div>

        <article>
          <h3 className="role-heading">
            <span>{title}</span>
            <span className="company">
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {company}
                </a>
              ) : (
                company
              )}
            </span>
          </h3>
          {currentTeam && <p className="role-team">Current team: {currentTeam}</p>}
          <div className="role-details" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </StyledRole>
    );
  });

  return (
    <StyledJobsSection id="jobs">
      <h2 className="numbered-heading">Where I’ve worked</h2>

      <StyledTimeline>{roles.slice(0, 2)}</StyledTimeline>
      {roles.length > 2 && (
        <details className="earlier-experience">
          <summary>
            Earlier experience <span>{roles.length - 2} roles</span>
          </summary>
          <StyledTimeline>{roles.slice(2)}</StyledTimeline>
        </details>
      )}
    </StyledJobsSection>
  );
};

export default Jobs;
