import React from 'react';
import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';
import { Layout } from '@components';
import { navLinks } from '@config';

const enter = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledNotFoundSection = styled.section`
  && {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: calc(100vh - var(--nav-height) - 78px);
    padding: calc(var(--nav-height) + 56px) var(--frame-pad) 72px;

    @media (max-width: 900px) {
      padding-right: 40px;
      padding-left: 40px;
    }

    @media (max-width: 768px) {
      padding: calc(var(--nav-height) + 34px) var(--frame-pad-sm) 56px;
    }
  }

  .not-found-inner {
    max-width: 720px;

    @media (prefers-reduced-motion: no-preference) {
      animation: ${enter} 0.6s var(--easing) both;
    }
  }

  .not-found-kicker {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 22px;
    color: var(--accent-strong);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    font-weight: 600;
    text-transform: uppercase;

    &:before {
      content: '';
      width: 34px;
      height: 2px;
      background: var(--warm);
    }
  }

  h1 {
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 76px;
    font-weight: 600;
    line-height: 0.92;

    @media (max-width: 900px) {
      font-size: 58px;
    }

    @media (max-width: 480px) {
      font-size: 46px;
    }

    span {
      color: var(--warm);
    }
  }

  .not-found-note {
    max-width: 560px;
    margin: 26px 0 0;
    color: var(--ink-soft);
    font-family: var(--font-serif);
    font-size: 26px;
    font-style: italic;
    line-height: 1.25;

    @media (max-width: 480px) {
      font-size: 22px;
    }
  }

  .not-found-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 36px;
  }

  .home-link {
    ${({ theme }) => theme.mixins.bigButton};
  }

  .not-found-links {
    margin: 54px 0 0;
    padding: 22px 0 0;
    border-top: 1px solid var(--line-strong);

    p {
      margin: 0 0 14px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: var(--fz-xs);
      text-transform: uppercase;
    }

    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 28px;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    a {
      padding-bottom: 3px;
      border-bottom: 1px solid var(--line-strong);
      color: var(--ink-soft);
      font-size: var(--fz-sm);
      font-weight: 600;

      &:hover,
      &:focus-visible {
        border-color: var(--accent);
        color: var(--accent-strong);
      }
    }
  }
`;

const NotFoundPage = ({ location }) => (
  <Layout
    location={location}
    title="Page not found"
    description="This address may be outdated. Return home to explore my work, writing, and contact details.">
    <main className="fillHeight">
      <StyledNotFoundSection aria-labelledby="not-found-title">
        <div className="not-found-inner">
          <p className="not-found-kicker">Error 404</p>
          <h1 id="not-found-title">
            Page not found<span aria-hidden="true">.</span>
          </h1>
          <p className="not-found-note">
            This address may be outdated. Return home to explore my work, writing, and contact
            details.
          </p>

          <div className="not-found-actions">
            <Link className="home-link" to="/">
              Go to homepage
            </Link>
          </div>

          <div className="not-found-links">
            <p>Or jump to</p>
            <ul>
              {navLinks.map(({ name, url }) => (
                <li key={url}>
                  <Link to={url}>{name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </StyledNotFoundSection>
    </main>
  </Layout>
);

NotFoundPage.propTypes = {
  location: PropTypes.object.isRequired,
};

export default NotFoundPage;
