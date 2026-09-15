import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'gatsby';
import styled from 'styled-components';
import { usePrefersReducedMotion } from '@hooks';
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

  .footer-duck-control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 48px;
    height: 50px;
    padding: 0;
    background: transparent;
    border-radius: var(--radius-sm);

    &:disabled {
      cursor: default;
    }
  }

  .footer-duck {
    width: 48px;
    height: 50px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .footer-links {
    display: flex;
    flex-wrap: wrap;
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

const Footer = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isInteractive, setIsInteractive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const duckRef = useRef(null);
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsPlaying(false);
    }
    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || document.hidden) {
          setIsPlaying(false);
        } else if (!prefersReducedMotion && !hasAutoPlayed.current) {
          hasAutoPlayed.current = true;
          setIsPlaying(true);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(duckRef.current);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setIsPlaying(false), 3000);
    const onVisibilityChange = () => {
      if (document.hidden) {
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isPlaying]);

  const animationLabel = isPlaying ? 'Pause Psyduck animation' : 'Play Psyduck animation';

  return (
    <StyledFooter>
      <div className="footer-inner">
        <p className="footer-mark">
          <button
            className="footer-duck-control"
            type="button"
            ref={duckRef}
            disabled={!isInteractive}
            onClick={() => setIsPlaying(playing => !playing)}
            aria-label={animationLabel}
            title={animationLabel}>
            <img
              className="footer-duck"
              src={isPlaying ? '/images/pixel-duck.gif' : pixelDuck}
              width="48"
              height="50"
              alt=""
              loading="lazy"
              onError={() => {
                if (isPlaying) {
                  console.warn('The Psyduck animation could not be loaded.');
                  setIsPlaying(false);
                }
              }}
            />
          </button>
          <span>
            Aniket Biswas<span className="footer-dot">.</span>
          </span>
        </p>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/playground">Playground</Link>
          <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
            Résumé
          </a>
          <a href="/loanlens">LoanLens</a>
        </nav>
        <p>Built with Gatsby · © {new Date().getFullYear()}</p>
      </div>
    </StyledFooter>
  );
};

export default Footer;
