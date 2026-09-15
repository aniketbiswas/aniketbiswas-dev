<div align="center">
  <img alt="Logo" src="./src/images/pixel-computer.png" width="100" />
</div>
<h1 align="center">
  Aniket Biswas — Portfolio
</h1>
<p align="center">
  Personal portfolio of <a href="https://aniketbiswas.dev" target="_blank">Aniket Biswas</a>,
  built with <a href="https://www.gatsbyjs.org/" target="_blank">Gatsby</a> and hosted on
  <a href="https://learn.microsoft.com/azure/storage/blobs/storage-blob-static-website" target="_blank">Azure Blob Storage</a>
  behind <a href="https://azure.microsoft.com/products/frontdoor" target="_blank">Azure Front Door</a>.
</p>

## Credits

This site began as a fork of [Brittany Chiang's v4 portfolio](https://github.com/bchiang7/v4),
which is released under the MIT License (© 2018 Brittany Chiang). The design, content, and most
components have since been rewritten, but parts of the original scaffolding remain — including the
Gatsby configuration, styling utilities, and several UI primitives.

The original MIT license is retained in [LICENSE](./LICENSE). If you are looking for the original
template, please go to [bchiang7/v4](https://github.com/bchiang7/v4) rather than this repository.

## Installation & set up

1. Install the Gatsby CLI

   ```sh
   npm install -g gatsby-cli
   ```

2. Install and use Node 22 using [NVM](https://github.com/nvm-sh/nvm), matching `.nvmrc` and
   the health-check workflow

   ```sh
   nvm install
   nvm use
   ```

3. Install dependencies

   ```sh
   yarn
   ```

4. Start the development server

   ```sh
   npm start
   ```

## Building for production

1. Generate a clean production build into `public/`

   ```sh
   npm run build:prod
   ```

2. Preview the site as it will appear once deployed

   ```sh
   npm run serve
   ```

Deployment uploads the contents of `public/` to the storage account's `$web` container. Azure
Front Door serves the custom domains and their managed HTTPS certificates. See
[docs/AZURE_SETUP.md](./docs/AZURE_SETUP.md) for the verified setup and domain-renewal steps.

## Résumé source

The editable résumé is [docs/resume.tex](./docs/resume.tex). With
[Tectonic](https://tectonic-typesetting.github.io/) installed, rebuild the downloadable PDF with:

```sh
npm run build:resume
```

This compiles locally with untrusted-input protections and writes `static/resume.pdf`.
Run the website build afterward to copy the PDF into the production preview. Review the
one-page layout, extracted text, and links before deploying; the command does not publish files.
Keep measurement definitions faithful to the owner's supplied information rather than inferring
what a reliability percentage represents.

## Checks before publishing

The pre-commit hook formats staged files with Prettier and checks JavaScript with ESLint.
ESLint uses the Prettier compatibility preset so their formatting rules do not conflict.

```sh
npm run test:site-health
npm run test:release
npm run build:prod
npm run serve
```

With the production preview running, use another terminal to check its actual pages and assets:

```sh
npm run check:site -- http://localhost:9000 --portfolio-only
```

The local check verifies the homepage, résumé PDF, social preview image, and Playground routes.
LoanLens is built and published by the separate private `aniketbiswas/loanlens` repository,
so `--portfolio-only` excludes it from this local preview. The default public check still
verifies both clean LoanLens addresses. See [release ownership](docs/RELEASE.md) before publishing;
never delete old LoanLens blobs because they are absent from a portfolio build.
It checks content types and page markers so a fallback HTML page cannot masquerade as a PDF
or a missing route. HTTP previews do not perform certificate checks.

After deployment, run `npm run check:site` against the public domain. HTTPS checks validate the
certificate and require at least 14 days before expiry. The
[public website health workflow](./.github/workflows/site-health.yml) runs the same check daily
and on demand once it is pushed to the default branch. Enable GitHub Actions notifications to
receive failure alerts.

## Content

Site content is authored as markdown under `content/`:

| Folder                    | Renders             |
| ------------------------- | ------------------- |
| `content/jobs/`           | Experience timeline |
| `content/featured/`       | Selected work       |
| `content/certifications/` | Credentials         |

Design tokens live in [src/styles/variables.js](./src/styles/variables.js).

A single introduction combines the hero and About content, followed by Experience, selected
work, Writing, Credentials, and Contact. The About link targets this introduction, including
when returning from another section or page. Its smaller portrait supports two short paragraphs
instead of competing with the text. The technology list is always visible, including without
JavaScript. The introduction retains a résumé link; selected work is reached through the
persistent navigation rather than an additional hero button.

The fixed header stays visible while scrolling; desktop links and the mobile
“Sections” menu use the same ordered links and indicate the current section. Sticky section
headings sit below the header, and anchor targets retain enough clearance to stay readable.
Whitespace separates sections without extra bottom dividers; the rules framing section
headings remain.

Experience shows the two most recent roles first; the remaining roles are available in a
native “Earlier experience” disclosure, including without JavaScript. The standalone metrics
strip and project outcome framing are omitted. Existing achievement figures remain scoped
to their original roles.

The latest role can include an optional `currentTeam` field. It is shown separately from
employment dates so a team change does not imply a new role or rewrite historical achievements.
Current profile copy uses the owner-confirmed OneDrive and SharePoint team name. The introduction
describes problem-solving across products, systems, and AI, grounded in the supplied
product, native Android, notification-system, AI Harness, MCP, and deep-learning experience.
The AI Harness is current work, not a limit on the engineer's scope. The copy does not claim
expertise in every technology, a fully autonomous lifecycle, or new performance figures.
Keep the tone matter-of-fact: concrete contributions, learning, and collaboration rather than
self-promotional superlatives or generic statements about approach. The introduction describes
the AI Harness and its use on an app-revamp feature without repeating the delivery metric.

Keep copy grounded in published content, the actual implementation, or facts explicitly supplied
by the site owner. Do not invent personal motivations, current initiatives, reading-time estimates,
or measurement scope.

Writing loads the public Medium RSS feed through RSS2JSON on each page visit. The account is set
by `mediumUsername` in `src/config.js`. All entries returned by the feed are shown in feed order,
using their titles, publication dates, and available images; no summaries or reading times are
invented. Medium/RSS2JSON caching and feed limits determine freshness and the available entries.
Tracking pixels are ignored, and articles without a cover image remain readable as text cards.
Loading, empty, failure, and retry states are explicit rather than falling back to a static
selection. The Medium profile link remains available when the feed fails or JavaScript is disabled.
Run `npm run test:feed` for the feed parsing and request checks.

The homepage has no timed loading overlay. The original Psyduck animation plays for up to three
seconds when the footer first comes into view, with a play/pause control for replaying it. It
stops offscreen or when the tab is hidden. Reduced-motion visitors get the static image unless
they explicitly choose to play; without JavaScript it remains a static, disabled control.

Keep the [portfolio screenshot](./content/featured/PortfolioWebsite/demo.png) and
[social preview](./static/og.png) aligned with the current homepage. The social image remains
1200 × 630 pixels.

Project `github`, `external`, and `cta` fields are optional. Only publish links that resolve to
the advertised project. The macOS project currently has no verified public demo or source URL,
so its links are omitted rather than sending visitors to unavailable destinations.

## Colour reference

| Token             | Hex       | Use                       |
| ----------------- | --------- | ------------------------- |
| `--paper`         | `#f3f1eb` | Page background           |
| `--paper-2`       | `#eae7df` | Alternate section surface |
| `--surface`       | `#fbfaf6` | Cards and raised surfaces |
| `--ink`           | `#17191f` | Headings                  |
| `--ink-soft`      | `#343840` | Secondary headings        |
| `--text`          | `#555961` | Body copy                 |
| `--text-muted`    | `#62666e` | Meta and captions         |
| `--line`          | `#d9d6ce` | Hairline borders          |
| `--line-strong`   | `#b9b7b0` | Structural rules          |
| `--accent`        | `#2457f5` | Links and interactive     |
| `--accent-strong` | `#173fc4` | Hover and emphasis        |
| `--warm`          | `#e85d3f` | Accent marks and details  |
