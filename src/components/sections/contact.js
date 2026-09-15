import React from 'react';
import styled from 'styled-components';
import { email, socialMedia } from '@config';
import { Icon } from '@components/icons';

const StyledContactSection = styled.section`
  background: var(--paper-2);
  color: var(--ink);

  .contact-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
    gap: 96px;
    align-items: start;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 42px;
    }
  }

  .contact-kicker {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 24px;
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

  .contact-title {
    max-width: 760px;
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 68px;
    font-weight: 600;
    line-height: 0.95;

    @media (max-width: 900px) {
      font-size: 54px;
    }

    @media (max-width: 480px) {
      font-size: 44px;
    }
  }

  .contact-aside {
    padding: 6px 0 4px 32px;
    border-left: 1px solid var(--line-strong);

    @media (max-width: 768px) {
      padding: 32px 0 0;
      border-top: 1px solid var(--line-strong);
      border-left: 0;
    }
  }

  .contact-text {
    margin: 0;
    color: var(--text);
    font-size: var(--fz-lg);
    line-height: 1.6;
  }

  .email-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 28px;
    padding: 10px 0 8px;
    border-bottom: 2px solid var(--accent);
    color: var(--ink);
    font-size: var(--fz-md);
    font-weight: 600;

    svg {
      width: 18px;
      height: 18px;
      color: var(--accent);
      transition: transform 0.2s var(--easing);
    }

    &:hover,
    &:focus-visible {
      color: var(--accent-strong);

      svg {
        transform: translate(3px, -3px);
      }
    }
  }

  .contact-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-top: 66px;
    padding-top: 22px;
    border-top: 1px solid var(--line-strong);

    @media (max-width: 600px) {
      align-items: flex-start;
      flex-direction: column;
      margin-top: 54px;
    }
  }

  .contact-meta-label {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    text-transform: uppercase;
  }

  .contact-socials {
    display: flex;
    align-items: center;
    gap: 4px;

    a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      color: var(--text-muted);

      &:hover,
      &:focus-visible {
        color: var(--accent);
        transform: translateY(-2px);
      }

      svg {
        width: 19px;
        height: 19px;
      }
    }
  }
`;

const Contact = () => (
  <StyledContactSection id="contact">
    <div className="contact-grid">
      <div>
        <p className="contact-kicker">Say hello</p>
        <h2 className="contact-title">Get in touch</h2>
      </div>

      <div className="contact-aside">
        <p className="contact-text">
          Have a question or want to say hello? You can reach me by email.
        </p>
        <a className="email-link" href={`mailto:${email}`}>
          Email me <Icon name="External" />
        </a>
      </div>
    </div>

    <div className="contact-meta">
      <p className="contact-meta-label">Elsewhere online</p>
      <div className="contact-socials" aria-label="Social links">
        {socialMedia.map(({ url, name }) => (
          <a key={name} href={url} aria-label={name} target="_blank" rel="noopener noreferrer">
            <Icon name={name} />
          </a>
        ))}
      </div>
    </div>
  </StyledContactSection>
);

export default Contact;
