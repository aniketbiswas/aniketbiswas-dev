import { css } from 'styled-components';

const button = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  color: var(--accent-strong);
  background-color: transparent;
  border: 1px solid var(--line-strong);
  border-radius: var(--border-radius);
  font-size: var(--fz-sm);
  font-family: var(--font-sans);
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  padding: 1.1rem 1.6rem;
  box-shadow: none;
  transition: var(--transition);

  &:hover,
  &:focus-visible {
    color: var(--accent-strong);
    border-color: var(--accent);
    background-color: var(--accent-tint);
    transform: translateY(-2px);
    box-shadow: none;
  }
  &:after {
    display: none !important;
  }
`;

const mixins = {
  flexCenter: css`
    display: flex;
    justify-content: center;
    align-items: center;
  `,

  flexBetween: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,

  link: css`
    display: inline-block;
    text-decoration: none;
    text-decoration-skip-ink: auto;
    color: inherit;
    position: relative;
    transition: var(--transition);

    &:hover,
    &:focus-visible {
      color: var(--green);
    }
  `,

  inlineLink: css`
    display: inline-block;
    position: relative;
    color: var(--accent-strong);
    transition: var(--transition);

    &:hover,
    &:focus-visible {
      color: var(--accent);
      &:after {
        width: 100%;
      }
      & > * {
        color: var(--accent) !important;
        transition: var(--transition);
      }
    }
    &:after {
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      position: relative;
      bottom: 0.37em;
      background-color: var(--accent);
      opacity: 0.35;
      @media (prefers-reduced-motion: no-preference) {
        transition: var(--transition);
      }
    }
  `,

  button,

  smallButton: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    color: var(--accent-strong);
    background-color: transparent;
    border: 1px solid var(--line-strong);
    border-radius: var(--border-radius);
    padding: 0.7rem 1rem;
    font-size: var(--fz-xs);
    font-family: var(--font-sans);
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
    box-shadow: none;
    transition: var(--transition);

    &:hover,
    &:focus-visible {
      color: var(--accent-strong);
      border-color: var(--accent);
      background-color: var(--accent-tint);
      transform: translateY(-2px);
      box-shadow: none;
    }
    &:after {
      display: none !important;
    }
  `,

  bigButton: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    color: #ffffff;
    background-color: var(--accent);
    background-image: none;
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    padding: 1.15rem 1.9rem;
    font-size: var(--fz-sm);
    font-family: var(--font-sans);
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
    box-shadow: var(--shadow-accent);
    transition: var(--transition);

    &:hover,
    &:focus-visible {
      color: #ffffff;
      transform: translateY(-3px);
      background-color: var(--accent-strong);
      box-shadow: 0 18px 34px -18px rgba(36, 87, 245, 0.85);
    }
    &:after {
      display: none !important;
    }
  `,

  boxShadow: css`
    box-shadow: var(--shadow-md);
    transition: var(--transition);

    &:hover,
    &:focus-visible {
      box-shadow: var(--shadow-lg);
    }
  `,

  glassCard: css`
    position: relative;
    background: var(--glass-bg-strong);
    backdrop-filter: blur(12px) saturate(1.1);
    -webkit-backdrop-filter: blur(12px) saturate(1.1);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-md);
    transition: transform 0.3s var(--easing), box-shadow 0.3s var(--easing),
      border-color 0.3s var(--easing);

    &:hover,
    &:focus-within {
      transform: translateY(-6px);
      box-shadow: var(--shadow-xl);
      border-color: var(--accent-tint-strong);
    }
  `,

  gradientText: css`
    background: var(--gradient-text);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  `,

  chip: css`
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 13px;
    background-color: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    color: var(--ink-soft);
    font-family: var(--font-mono);
    font-size: var(--fz-xs);
    box-shadow: var(--shadow-sm);
    transition: var(--transition);

    &:hover {
      border-color: var(--accent);
      color: var(--accent-strong);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  `,

  fancyList: css`
    padding: 0;
    margin: 0;
    list-style: none;
    font-size: var(--fz-lg);
    li {
      position: relative;
      padding-left: 30px;
      margin-bottom: 10px;
      &:before {
        content: '▹';
        position: absolute;
        left: 0;
        color: var(--green);
      }
    }
  `,

  resetList: css`
    list-style: none;
    padding: 0;
    margin: 0;
  `,
};

export default mixins;
