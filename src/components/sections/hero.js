import React from 'react';
import { StaticImage } from 'gatsby-plugin-image';
import styled, { keyframes } from 'styled-components';
import { Icon } from '@components/icons';

const enter = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledHeroSection = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: calc(var(--nav-height) + 64px) var(--frame-pad) 64px;

  @media (max-width: 900px) {
    padding-right: 40px;
    padding-left: 40px;
  }

  @media (max-width: 768px) {
    padding: calc(var(--nav-height) + 34px) var(--frame-pad-sm) 36px;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    align-items: center;
    gap: 64px;

    @media (max-width: 900px) {
      grid-template-columns: minmax(0, 1fr) 220px;
      gap: 36px;
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  }

  .hero-copy,
  .hero-portrait {
    @media (prefers-reduced-motion: no-preference) {
      animation: ${enter} 0.65s var(--easing) both;
    }
  }

  .hero-portrait {
    animation-delay: 0.12s;
  }

  h1 {
    max-width: 720px;
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 80px;
    font-weight: 600;
    letter-spacing: 0;
    line-height: 0.84;

    @media (max-width: 1080px) {
      font-size: 74px;
    }

    @media (max-width: 900px) {
      font-size: 64px;
    }

    @media (max-width: 480px) {
      font-size: 52px;
    }

    span {
      color: var(--warm);
    }
  }

  .hero-role {
    max-width: 690px;
    text-wrap: balance;
    margin: 30px 0 0;
    color: var(--ink-soft);
    font-family: var(--font-serif);
    font-size: 34px;
    font-style: italic;
    line-height: 1.18;

    @media (max-width: 900px) {
      font-size: 28px;
    }

    @media (max-width: 480px) {
      margin-top: 22px;
      font-size: 25px;
    }
  }

  .hero-description {
    max-width: 660px;
    margin-top: 24px;
    color: var(--text);
    font-size: var(--fz-xl);
    line-height: 1.6;

    p {
      margin: 0;
    }

    p + p {
      margin-top: 16px;
    }

    @media (max-width: 480px) {
      font-size: var(--fz-lg);
    }
  }

  .resume-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 14px 0 11px;
    border-bottom: 2px solid var(--line-strong);
    color: var(--ink-soft);
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
      border-color: var(--accent);
      color: var(--accent-strong);

      svg {
        transform: translate(2px, -2px);
      }
    }
  }

  .hero-portrait {
    position: relative;
    width: 100%;
    max-width: 300px;
    justify-self: end;
    margin: 0;
    padding: 10px 10px 0 0;

    &:before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 76%;
      height: 70%;
      background: var(--accent);
    }

    &:after {
      content: '';
      position: absolute;
      right: -10px;
      bottom: -10px;
      width: 42%;
      height: 34%;
      background: var(--warm);
      z-index: -1;
    }

    @media (max-width: 768px) {
      max-width: 220px;
      justify-self: start;
    }
  }

  .portrait-image {
    aspect-ratio: 4 / 5;
    width: 100%;
    border: 1px solid var(--ink);
    background: var(--paper-2);

    img {
      object-fit: cover !important;
      object-position: 55% 42% !important;
      filter: saturate(0.88) contrast(1.03);
    }

    @media (max-width: 768px) {
      aspect-ratio: 16 / 10;
    }
  }

  .hero-technologies {
    margin-top: 32px;

    h2 {
      margin: 0;
      color: var(--ink);
      font-family: var(--font-sans);
      font-size: var(--fz-md);
      line-height: 1.4;
    }
  }

  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 22px;
    padding: 12px 0 0;
    margin: 0;
    list-style: none;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
  }
`;

const skills = [
  'JavaScript/TypeScript',
  'React/React Native',
  'Node.js/Go',
  'GraphQL/REST APIs',
  'Python/TensorFlow/Keras',
  'MCP & LLM Integration',
  'OpenAI & Anthropic APIs',
  'Azure AI Foundry',
];

const Hero = () => (
  <StyledHeroSection id="about" aria-labelledby="hero-title">
    <div className="hero-grid">
      <div className="hero-copy">
        <h1 id="hero-title">
          Aniket Biswas<span aria-hidden="true">.</span>
        </h1>
        <p className="hero-role">Understanding problems. Building useful software.</p>
        <div className="hero-description">
          <p>
            I’m a Software Engineer II at Microsoft, currently on the OneDrive and SharePoint team.
            My work has ranged from product features and native Android integrations to notification
            systems and applied AI.
          </p>
          <p>
            I’m building the AI Harness, a contract-driven framework for spec-validated,
            LLM-assisted engineering. I’ve used it to lead development of an app-revamp feature in
            an existing codebase.
          </p>
        </div>

        <a className="resume-link" href="/resume.pdf" target="_blank" rel="noopener noreferrer">
          Résumé <Icon name="External" />
        </a>
      </div>

      <figure className="hero-portrait">
        <StaticImage
          className="portrait-image"
          src="../../images/me.jpg"
          width={600}
          quality={95}
          formats={['AUTO', 'WEBP']}
          loading="eager"
          alt="Portrait of Aniket Biswas"
        />
      </figure>
    </div>

    <div className="hero-technologies">
      <h2 id="technologies-title">Technologies</h2>
      <ul className="skills-list" aria-labelledby="technologies-title">
        {skills.map(skill => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </div>
  </StyledHeroSection>
);

export default Hero;
