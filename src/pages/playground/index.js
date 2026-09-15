import React from 'react';
import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';
import { Layout } from '@components';
import { Icon } from '@components/icons';

const enter = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledPlaygroundSection = styled.section`
  && {
    padding: calc(var(--nav-height) + 72px) var(--frame-pad) 96px;

    @media (max-width: 900px) {
      padding-right: 40px;
      padding-left: 40px;
    }

    @media (max-width: 768px) {
      padding: calc(var(--nav-height) + 44px) var(--frame-pad-sm) 72px;
    }
  }

  .playground-header {
    max-width: 720px;

    @media (prefers-reduced-motion: no-preference) {
      animation: ${enter} 0.6s var(--easing) both;
    }
  }

  .playground-kicker {
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
    font-size: 64px;
    font-weight: 600;
    line-height: 0.95;

    @media (max-width: 900px) {
      font-size: 52px;
    }

    @media (max-width: 480px) {
      font-size: 42px;
    }
  }

  .playground-note {
    max-width: 560px;
    margin: 24px 0 0;
    color: var(--ink-soft);
    font-family: var(--font-serif);
    font-size: 25px;
    font-style: italic;
    line-height: 1.25;

    @media (max-width: 480px) {
      font-size: 21px;
    }
  }
`;

const StyledExperimentList = styled.ol`
  padding: 0;
  margin: 64px 0 0;
  list-style: none;
  border-top: 1px solid var(--line-strong);

  @media (max-width: 768px) {
    margin-top: 44px;
  }
`;

const StyledExperiment = styled.li`
  border-bottom: 1px solid var(--line-strong);

  a {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr) auto;
    align-items: baseline;
    gap: 28px;
    padding: 34px 0;
    color: inherit;

    @media (max-width: 700px) {
      grid-template-columns: 1fr auto;
      gap: 10px 20px;
      padding: 26px 0 30px;
    }

    &:hover,
    &:focus-visible {
      color: inherit;

      .experiment-title {
        color: var(--accent-strong);
      }

      svg {
        transform: translate(2px, -2px);
      }
    }
  }

  .experiment-index {
    color: var(--accent-strong);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    font-weight: 600;
    text-transform: uppercase;

    @media (max-width: 700px) {
      grid-column: 1 / -1;
    }
  }

  .experiment-title {
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 600;
    line-height: 1.05;
    transition: color 0.2s var(--easing);

    @media (max-width: 480px) {
      font-size: 27px;
    }
  }

  .experiment-copy {
    margin: 12px 0 0;
    color: var(--text);
    font-size: var(--fz-md);
    line-height: 1.6;
  }

  .experiment-tech {
    display: inline-block;
    margin-top: 14px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
  }

  svg {
    width: 18px;
    height: 18px;
    color: var(--warm);
    transition: transform 0.2s var(--easing);
  }
`;

const experiments = [
  {
    title: 'Liquid Typography',
    url: '/playground/liquid-typography',
    copy: 'Canvas text that wraps around a movable circular opening. Explore pointer, touch, and keyboard controls, then compare shape-based wrapping and fitted text widths.',
    tech: '@chenglou/pretext',
  },
];

const PlaygroundPage = ({ location }) => (
  <Layout
    location={location}
    title="Playground"
    description="Interactive experiments in text layout and canvas rendering.">
    <main className="fillHeight">
      <StyledPlaygroundSection aria-labelledby="playground-title">
        <div className="playground-header">
          <p className="playground-kicker">Playground</p>
          <h1 id="playground-title">Interface experiments</h1>
          <p className="playground-note">Text layout and rendering experiments.</p>
        </div>

        <StyledExperimentList>
          {experiments.map(({ title, url, copy, tech }, index) => (
            <StyledExperiment key={url}>
              <Link to={url}>
                <span className="experiment-index">
                  Experiment {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <h2 className="experiment-title">{title}</h2>
                  <span className="experiment-copy">{copy}</span>
                  <span className="experiment-tech">{tech}</span>
                </span>
                <Icon name="External" />
              </Link>
            </StyledExperiment>
          ))}
        </StyledExperimentList>
      </StyledPlaygroundSection>
    </main>
  </Layout>
);

PlaygroundPage.propTypes = {
  location: PropTypes.object.isRequired,
};

export default PlaygroundPage;
