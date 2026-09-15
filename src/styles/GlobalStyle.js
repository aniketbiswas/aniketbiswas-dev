import { createGlobalStyle } from 'styled-components';
import fonts from './fonts';
import variables from './variables';
import TransitionStyles from './TransitionStyles';
import PrismStyles from './PrismStyles';

const GlobalStyle = createGlobalStyle`
  ${fonts};
  ${variables};

  html {
    box-sizing: border-box;
    width: 100%;
    scroll-behavior: smooth;
    scroll-padding-top: var(--nav-height);
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }

    *,
    *:before,
    *:after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0ms !important;
    }
  }

  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  ::selection {
    background-color: var(--accent-tint-strong);
    color: var(--accent-strong);
  }

  /* Provide basic, default focus styles.*/
  :focus {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }

  /*
    Remove default focus styles for mouse users ONLY if
    :focus-visible is supported on this platform.
  */
  :focus:not(:focus-visible) {
    outline: none;
    outline-offset: 0px;
  }

  /*
    Optionally: If :focus-visible is supported on this
    platform, provide enhanced focus styles for keyboard
    focus.
  */
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }

  /* Scrollbar Styles */
  html {
    scrollbar-width: thin;
    scrollbar-color: var(--line-strong) var(--paper);
  }
  ::-webkit-scrollbar {
    width: 12px;
  }
  ::-webkit-scrollbar-track {
    background: var(--paper);
  }
  ::-webkit-scrollbar-thumb {
    background-color: var(--line-strong);
    border: 3px solid var(--paper);
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: var(--accent);
  }

  body {
    margin: 0;
    width: 100%;
    min-height: 100%;
    overflow-x: hidden;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    background-color: var(--paper);
    background-image: linear-gradient(rgba(23, 25, 31, 0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(23, 25, 31, 0.025) 1px, transparent 1px);
    background-size: 48px 48px;
    color: var(--slate);
    font-family: var(--font-sans);
    font-size: var(--fz-lg);
    line-height: 1.55;

    @media (max-width: 480px) {
      font-size: var(--fz-lg);
    }

    &.blur {
      overflow: hidden;

      header {
        background-color: transparent;
      }

      #content > * {
        filter: blur(5px) brightness(0.7);
        transition: var(--transition);
        pointer-events: none;
        user-select: none;
      }
    }
  }

  #root {
    min-height: 100vh;
    display: grid;
    grid-template-rows: 1fr auto;
    grid-template-columns: 100%;
  }

  main {
    margin: 0 auto;
    width: 100%;
    max-width: var(--content-max);
    min-height: 100vh;
    padding: 200px 150px;

    @media (max-width: 1080px) {
      padding: 200px 100px;
    }
    @media (max-width: 768px) {
      padding: 150px 50px;
    }
    @media (max-width: 480px) {
      padding: 125px 25px;
    }

    &.fillHeight {
      max-width: var(--content-max);
      padding: 0;
    }
  }

  section {
    margin: 0 auto;
    padding: 100px 0;
    max-width: 1000px;

    @media (max-width: 768px) {
      padding: 80px 0;
    }

    @media (max-width: 480px) {
      padding: 60px 0;
    }
  }

  main.fillHeight > section {
    max-width: 100%;
    margin: 0;
    border-bottom: 1px solid var(--line-frame);

    &:last-child {
      border-bottom: 0;
    }
  }

  main.fillHeight > section:not(:first-child) {
    padding: var(--section-padding-block, 96px) var(--frame-pad);

    @media (max-width: 900px) {
      padding: var(--section-padding-block, 80px) 40px;
    }
    @media (max-width: 768px) {
      padding: var(--section-padding-block, 64px) var(--frame-pad-sm);
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0 0 10px 0;
    font-weight: 600;
    color: var(--lightest-slate);
    line-height: 1.1;
  }

  .big-heading {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 80px;
    line-height: 1;
    letter-spacing: 0;

    @media (max-width: 768px) {
      font-size: 56px;
    }
  }

  .medium-heading {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 60px;
    line-height: 1.02;
    letter-spacing: 0;

    @media (max-width: 768px) {
      font-size: 44px;
    }
  }

  .numbered-heading {
    position: sticky;
    top: 0;
    z-index: 8;
    display: block;
    max-width: none;
    margin: 0 0 24px;
    padding: 22px 0 18px;
    width: 100%;
    background: rgba(243, 241, 235, 0.96);
    border-top: 1px solid var(--line-strong);
    border-bottom: 1px solid var(--line-frame);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 52px;
    letter-spacing: 0;
    line-height: 1;
    color: var(--ink);

    @media (max-width: 768px) {
      margin-bottom: 20px;
      padding: 16px 0 14px;
      font-size: 36px;
    }
  }

  img,
  svg,
  .gatsby-image-wrapper {
    width: 100%;
    max-width: 100%;
    vertical-align: middle;
  }

  img:not([alt]) {
    filter: blur(5px);
  }

  svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
    vertical-align: middle;

    &.feather {
      fill: none;
    }
  }

  a {
    display: inline-block;
    text-decoration: none;
    text-decoration-skip-ink: auto;
    color: inherit;
    position: relative;
    transition: var(--transition);

    &:hover,
    &:focus {
      color: var(--green);
    }

    &.inline-link {
      ${({ theme }) => theme.mixins.inlineLink};
    }
  }

  button {
    cursor: pointer;
    border: 0;
    border-radius: 0;
  }

  input, textarea {
    border-radius: 0;
    outline: 0;

    &:focus {
      outline: 0;
    }
    &:focus,
    &:active {
      &::placeholder {
        opacity: 0.5;
      }
    }
  }

  p {
    margin: 0 0 15px 0;

    &:last-child,
    &:last-of-type {
      margin: 0;
    }

    & > a {
      ${({ theme }) => theme.mixins.inlineLink};
    }

    & > code {
      background-color: var(--accent-tint);
      color: var(--accent-strong);
      font-size: var(--fz-sm);
      border: 1px solid var(--accent-tint-strong);
      border-radius: var(--radius-sm);
      padding: 0.2em 0.45em;
    }
  }

  ul {
    &.fancy-list {
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
    }
  }

  blockquote {
    border-left-color: var(--green);
    border-left-style: solid;
    border-left-width: 1px;
    margin-left: 0px;
    margin-right: 0px;
    padding-left: 1.5rem;

    p {
      font-style: italic;
      font-size: 24px;
    }
  }

  hr {
    background-color: var(--lightest-navy);
    height: 1px;
    border-width: 0px;
    border-style: initial;
    border-color: initial;
    border-image: initial;
    margin: 1rem;
  }

  code {
    font-family: var(--font-mono);
    font-size: var(--fz-md);
  }

  .skip-to-content {
    ${({ theme }) => theme.mixins.button};
    position: absolute;
    top: auto;
    left: -999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
    z-index: -99;

    &:hover,
    &:focus {
      background-color: var(--green);
      color: var(--navy);
      top: 0;
      left: 0;
      width: auto;
      height: auto;
      overflow: auto;
      z-index: 99;
      box-shadow: none;
      transform: none;
    }
  }

  #logo {
    color: var(--green);
  }

  .overline {
    color: var(--green);
    font-family: var(--font-mono);
    font-size: var(--fz-md);
    font-weight: 400;
  }

  .subtitle {
    color: var(--green);
    margin: 0 0 20px 0;
    font-size: var(--fz-md);
    font-family: var(--font-mono);
    font-weight: 400;
    line-height: 1.5;
    @media (max-width: 1080px) {
      font-size: var(--fz-sm);
    }
    @media (max-width: 768px) {
      font-size: var(--fz-xs);
    }

    a {
      ${({ theme }) => theme.mixins.inlineLink};
      line-height: 1.5;
    }
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    margin-bottom: 50px;
    color: var(--green);

    .arrow {
      display: block;
      margin-right: 10px;
      padding-top: 4px;
    }

    a {
      ${({ theme }) => theme.mixins.inlineLink};
      font-family: var(--font-mono);
      font-size: var(--fz-sm);
      font-weight: 600;
      line-height: 1.5;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
  }

  .gatsby-image-outer-wrapper {
    height: 100%;
  }

  ${TransitionStyles};

  ${PrismStyles};

  /* Cursor Spotlight — a soft warm light catching the paper */
  body {
    --cursor-x: 50%;
    --cursor-y: 50%;
  }

  body::before {
    content: '';
    position: fixed;
    top: var(--cursor-y);
    left: var(--cursor-x);
    width: 620px;
    height: 620px;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.6) 0%,
      rgba(94, 234, 212, 0.08) 30%,
      rgba(255, 255, 255, 0) 70%
    );
    border-radius: 50%;
    pointer-events: none;
    z-index: -1;
    transform: translate(-50%, -50%);
    transition: opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    opacity: 0;
    filter: blur(20px);
    mix-blend-mode: normal;
  }

  body.cursor-visible::before {
    opacity: 0.65;
  }
`;

export default GlobalStyle;
