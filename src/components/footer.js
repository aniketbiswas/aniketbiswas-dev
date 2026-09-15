import React from 'react';
import { Link } from 'gatsby';
import styled from 'styled-components';
import pixelDuck from '@images/pixel-duck.png';

const StyledFooter = styled.footer`
  border-top: 1px solid var(--line-frame);
  background: var(--paper);

  .footer-inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 24px;
    width: 100%;
    max-width: var(--content-max);
    min-height: 78px;
    margin: 0 auto;
    padding: 18px var(--frame-pad);

    @media (max-width: 900px) {
      padding-right: 40px;
      padding-left: 40px;
    }

    @media (max-width: 600px) {
      align-items: flex-start;
      flex-direction: column;
      gap: 6px;
      padding: 24px var(--frame-pad-sm);
    }
  }

  p {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    text-transform: uppercase;
  }

  .footer-mark {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: var(--fz-md);
    font-weight: 600;
    text-transform: none;
  }

  .footer-dot {
    color: var(--warm);
  }

  .footer-duck {
    width: 32px;
    height: 33px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .footer-links {
    display: flex;
    align-items: center;
    gap: 22px;

    a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: var(--fz-xs);
      text-transform: uppercase;

      &:hover,
      &:focus-visible {
        color: var(--accent-strong);
      }
    }
  }
`;

const Footer = () => (
  <StyledFooter>
    <div className="footer-inner">
      <p className="footer-mark">
        <img className="footer-duck" src={pixelDuck} width="32" height="33" alt="" loading="lazy" />
        <span>
          Aniket Biswas<span className="footer-dot">.</span>
        </span>
      </p>
      <nav className="footer-links" aria-label="Footer">
        <Link to="/playground">Playground</Link>
        <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
          Résumé
        </a>
      </nav>
      <p>Built with Gatsby · © {new Date().getFullYear()}</p>
    </div>
  </StyledFooter>
);

export default Footer;
