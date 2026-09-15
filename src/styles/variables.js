import { css } from 'styled-components';

const variables = css`
  :root {
    /* ===========================================================
       Core palette — Warm Professional Light
       Semantic tokens are the source of truth. Legacy aliases below
       remap the original (dark-theme) variable names onto the new
       light values so existing components keep working.
       =========================================================== */

    /* Surfaces */
    --paper: #f3f1eb;
    --paper-2: #eae7df;
    --surface: #fbfaf6;
    --surface-2: #ffffff;

    /* Ink & text (the deep-navy lineage of the old theme) */
    --ink: #17191f;
    --ink-soft: #343840;
    --text: #555961;
    --text-muted: #62666e;
    --line: #d9d6ce;
    --line-strong: #b9b7b0;
    --line-frame: rgba(23, 25, 31, 0.12);

    /* Editorial layout grid */
    --content-max: 1240px;
    --frame-pad: 64px;
    --frame-pad-sm: 22px;

    /* Accent */
    --accent: #2457f5;
    --accent-strong: #173fc4;
    --accent-bright: #4f75f6;
    --accent-soft: #dce5ff;
    --accent-tint: rgba(36, 87, 245, 0.08);
    --accent-tint-strong: rgba(36, 87, 245, 0.15);

    /* Warm secondary */
    --warm: #e85d3f;
    --warm-strong: #b53a24;
    --warm-soft: #f4b4a5;
    --warm-tint: rgba(232, 93, 63, 0.11);

    /* Gradients */
    --gradient-accent: linear-gradient(135deg, #2457f5 0%, #173fc4 100%);
    --gradient-text: linear-gradient(118deg, #173fc4 0%, #2457f5 100%);
    --gradient-warm: linear-gradient(120deg, #2457f5 0%, #e85d3f 100%);
    --gradient-line: linear-gradient(90deg, var(--accent) 0%, rgba(36, 87, 245, 0) 100%);

    /* Glassmorphism */
    --glass-bg: rgba(243, 241, 235, 0.76);
    --glass-bg-strong: rgba(251, 250, 246, 0.9);
    --glass-border: rgba(23, 25, 31, 0.1);
    --glass-highlight: rgba(255, 255, 255, 0.9);

    /* Soft, layered shadows (depth without darkness) */
    --shadow-sm: 0 1px 2px rgba(23, 25, 31, 0.04);
    --shadow-md: 0 8px 24px rgba(23, 25, 31, 0.07);
    --shadow-lg: 0 20px 48px rgba(23, 25, 31, 0.1);
    --shadow-xl: 0 28px 70px rgba(23, 25, 31, 0.13);
    --shadow-accent: 0 14px 30px -16px rgba(36, 87, 245, 0.75);
    --shadow-warm: 0 14px 30px -16px rgba(232, 93, 63, 0.65);

    /* ===========================================================
       Legacy aliases — original names mapped onto the light theme
       =========================================================== */
    --dark-navy: var(--paper-2);
    --navy: var(--paper);
    --light-navy: var(--surface);
    --lightest-navy: var(--line);
    --navy-shadow: rgba(23, 25, 31, 0.12);
    --dark-slate: #9aa3b1;
    --slate: var(--text);
    --light-slate: var(--ink-soft);
    --lightest-slate: var(--ink);
    --white: #0d1620;
    --green: var(--accent);
    --green-tint: var(--accent-tint);
    --pink: #d6517d;
    --blue: #2f6df0;

    --font-sans: 'Calibre', 'Avenir Next', 'Helvetica Neue', sans-serif;
    --font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
    --font-display: 'Calibre', 'Avenir Next', 'Helvetica Neue', sans-serif;
    --font-serif: 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif;

    --fz-xxs: 13px;
    --fz-xs: 13px;
    --fz-sm: 14px;
    --fz-md: 16px;
    --fz-lg: 18px;
    --fz-xl: 20px;
    --fz-xxl: 22px;
    --fz-heading: 32px;

    /* Radii — softer, more modern than the original 4px */
    --border-radius: 4px;
    --radius-sm: 3px;
    --radius: 6px;
    --radius-lg: 8px;
    --radius-pill: 999px;

    --nav-height: 76px;
    --nav-scroll-height: 64px;

    --tab-height: 42px;
    --tab-width: 120px;

    --easing: cubic-bezier(0.645, 0.045, 0.355, 1);
    --transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1);

    --hamburger-width: 30px;

    --ham-before: top 0.1s ease-in 0.25s, opacity 0.1s ease-in;
    --ham-before-active: top 0.1s ease-out, opacity 0.1s ease-out 0.12s;
    --ham-after: bottom 0.1s ease-in 0.25s, transform 0.22s cubic-bezier(0.55, 0.055, 0.675, 0.19);
    --ham-after-active: bottom 0.1s ease-out,
      transform 0.22s cubic-bezier(0.215, 0.61, 0.355, 1) 0.12s;
  }
`;

export default variables;
