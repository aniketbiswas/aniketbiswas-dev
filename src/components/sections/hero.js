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
  min-height: 88vh;
  padding: calc(var(--nav-height) + 56px) var(--frame-pad) 48px;

  @media (max-width: 900px) {
    padding-right: 40px;
    padding-left: 40px;
  }

  @media (max-width: 768px) {
    min-height: 0;
    padding: calc(var(--nav-height) + 34px) var(--frame-pad-sm) 36px;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
    align-items: center;
    gap: 72px;

    @media (max-width: 900px) {
      gap: 44px;
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 36px;
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

  .hero-kicker {
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
    max-width: 720px;
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 92px;
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
    max-width: 600px;
    margin: 22px 0 0;
    color: var(--text);
    font-size: var(--fz-lg);
    line-height: 1.55;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 32px;
  }

  .work-link {
    ${({ theme }) => theme.mixins.bigButton};
  }

  .resume-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
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
    max-width: 430px;
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
      max-width: none;
      justify-self: stretch;
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
`;

const Hero = () => (
  <StyledHeroSection aria-labelledby="hero-title">
    <div className="hero-grid">
      <div className="hero-copy">
        <p className="hero-kicker">Software Engineer II · Microsoft</p>
        <h1 id="hero-title">
          Aniket Biswas<span aria-hidden="true">.</span>
        </h1>
        <p className="hero-role">Understanding problems. Building useful software.</p>
        <p className="hero-description">
          I’m a Software Engineer II at Microsoft, working across products, systems, and AI. On the
          OneDrive and SharePoint team, I’m building the AI Harness for spec-driven product
          development.
        </p>

        <div className="hero-actions">
          <a className="work-link" href="#projects">
            View selected work
          </a>
          <a className="resume-link" href="/resume.pdf" target="_blank" rel="noopener noreferrer">
            Résumé <Icon name="External" />
          </a>
        </div>
      </div>

      <figure className="hero-portrait">
        <StaticImage
          className="portrait-image"
          src="../../images/me.jpg"
          width={720}
          quality={95}
          formats={['AUTO', 'WEBP']}
          loading="eager"
          alt="Portrait of Aniket Biswas"
        />
      </figure>
    </div>
  </StyledHeroSection>
);

export default Hero;
