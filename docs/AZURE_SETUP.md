# Azure Static Web Apps — Deployment & Setup Guide

## aniketbiswas.dev

> Last updated: February 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Azure Static Web Apps (SWA)](#azure-static-web-apps-swa)
3. [Deployment Workflow](#deployment-workflow)
4. [Custom Domain (aniketbiswas.dev)](#custom-domain-aniketbiswasdev)
5. [Routing Configuration (staticwebapp.config.json)](#routing-configuration)
6. [How URL Routing Works (Gatsby + SWA)](#how-url-routing-works-gatsby--swa)
7. [Adding a New Route (e.g. /ETA)](#adding-a-new-route-eg-eta)
8. [Existing Routes](#existing-routes)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌───────────────┐     ┌─────────────────────┐     ┌──────────────────────────┐
│  Local Dev    │     │  GitHub Repository   │     │  Azure Static Web Apps   │
│  gatsby dev   │────▶│  aniketbiswas-dev    │     │  (Hosts public/ folder)  │
│               │push │  main branch         │     │                          │
└───────────────┘     └──────────┬───────────┘     └────────────┬─────────────┘
                                 │                              │
                     ┌───────────▼────────────┐                 │
                     │  gatsby build           │                 │
                     │  (generates public/)    │                 │
                     └───────────┬────────────┘                 │
                                 │                              │
                     ┌───────────▼────────────┐                 │
                     │  VS Code Azure Ext      │                │
                     │  Deploy to SWA          │────────────────▶
                     │  (uploads public/)      │
                     └────────────────────────┘

                                          ┌─────────────────────────────┐
                                          │  Custom Domain              │
                                          │  aniketbiswas.dev           │
                                          │  (CNAME → SWA auto-domain)  │
                                          └─────────────────────────────┘
```

### Stack Summary

| Component     | Technology                                |
| ------------- | ----------------------------------------- |
| Framework     | Gatsby v3 (React, Static Site Generator)  |
| Hosting       | **Azure Static Web Apps (SWA)**           |
| Custom Domain | `aniketbiswas.dev`                        |
| DNS           | Azure DNS (or domain registrar)           |
| Build Command | `gatsby build`                            |
| Deploy Method | VS Code Azure Static Web Apps Extension   |
| Source Branch | `main`                                    |
| Build Output  | `public/`                                 |
| Route Config  | `staticwebapp.config.json` (in `public/`) |

---

## Azure Static Web Apps (SWA)

### What Is It?

Azure Static Web Apps is a service that automatically builds and deploys full-stack
web apps from a code repository or directly from built assets. It provides:

- **Global CDN** — content served from edge nodes worldwide
- **Free SSL/TLS** — auto-provisioned HTTPS certificates
- **Custom domains** — supports apex and subdomain mapping
- **Routing engine** — server-side route rules, redirects, and navigation fallback
- **Staging environments** — preview deployments for pull requests

### Azure Portal Path

```
Azure Portal → Static Web Apps → <your-app-name>
```

### Key Settings in Azure Portal

| Setting          | Location                    | Value                                |
| ---------------- | --------------------------- | ------------------------------------ |
| App URL          | Overview                    | `https://<auto>.azurestaticapps.net` |
| Custom domain    | Settings → Custom domains   | `aniketbiswas.dev`                   |
| Deployment token | Settings → Deployment token | (secret — used for CI/CD)            |
| Configuration    | Settings → Configuration    | Environment variables                |
| API              | Settings → APIs             | Not used (static only)               |

---

## Deployment Workflow

### Current Process (VS Code Extension)

1. **Build locally:**

   ```bash
   gatsby clean && gatsby build
   ```

   This generates the static site in the `public/` folder.

2. **Deploy via VS Code:**

   - Open the **Azure** sidebar panel in VS Code
   - Find your Static Web App under **Resources → Static Web Apps**
   - Right-click the app → **Deploy to Static Web App...**
   - Select the `public/` folder as the build output
   - The extension uploads all files to Azure SWA

3. **Wait ~1–2 minutes** for the deployment to propagate globally.

### Alternative: Azure CLI Deployment

If you prefer the command line:

```bash
# Install SWA CLI (one-time)
npm install -g @azure/static-web-apps-cli

# Build the site
gatsby clean && gatsby build

# Deploy (you'll need your deployment token from Azure Portal)
swa deploy ./public \
  --deployment-token <YOUR_DEPLOYMENT_TOKEN> \
  --env production
```

### Alternative: GitHub Actions (Automated CI/CD)

To auto-deploy on every push to `main`, create `.github/workflows/azure-swa.yml`:

```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install & Build
        run: |
          npm ci
          npm run build

      - name: Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: upload
          app_location: /
          output_location: public
```

> Store the deployment token in GitHub → Repo Settings → Secrets →
> `AZURE_STATIC_WEB_APPS_API_TOKEN`

---

## Custom Domain (aniketbiswas.dev)

### How the Custom Domain Connects to Azure SWA

Azure SWA gives you an auto-generated URL like:

```
https://lively-water-0abcdefgh.azurestaticapps.net
```

You map your custom domain to this via a CNAME record.

### Setting Up the Custom Domain

#### Step 1: Add the domain in Azure Portal

```
Azure Portal → Static Web Apps → <your-app> → Settings → Custom domains → + Add
```

Enter: `aniketbiswas.dev`

Azure will tell you the required DNS record (typically a CNAME or TXT validation).

#### Step 2: Configure DNS Records

If using **Azure DNS**:

```
Azure Portal → DNS Zones → aniketbiswas.dev
```

| Name  | Type  | Value                                         | TTL  |
| ----- | ----- | --------------------------------------------- | ---- |
| `www` | CNAME | `<your-app>.azurestaticapps.net`              | 3600 |
| `@`   | ALIAS | `<your-app>.azurestaticapps.net` _(see note)_ | 3600 |

> **Apex domain note**: Azure DNS supports ALIAS records for apex domains (`@`).
> If your registrar doesn't support ALIAS/ANAME, you'll need to:
>
> - Use `www.aniketbiswas.dev` as the primary domain with a CNAME, OR
> - Transfer DNS to Azure DNS which supports ALIAS records for apex, OR
> - Use Azure Front Door in front of SWA for apex domain support

#### Step 3: Validate & Enable HTTPS

After DNS records propagate (can take up to 48 hours):

1. Go back to **Custom domains** in Azure Portal
2. Azure auto-validates the domain ownership
3. A **free SSL certificate** is auto-provisioned (Let's Encrypt)
4. HTTPS is enforced by default

### DNS Lookup Verification

```bash
# Check CNAME resolution
dig aniketbiswas.dev CNAME +short
dig www.aniketbiswas.dev CNAME +short

# Check if the site resolves
curl -I https://aniketbiswas.dev
```

---

## Routing Configuration

### staticwebapp.config.json

Azure SWA uses a configuration file for server-side routing rules, navigation
fallback, response overrides, and headers. This file must be in the **root of
your deployed output** (the `public/` folder).

**Place this file at:** `static/staticwebapp.config.json`  
(Gatsby copies everything from `static/` into `public/` at build time)

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": [
      "/images/*",
      "/static/*",
      "/icons/*",
      "/*.js",
      "/*.css",
      "/*.json",
      "/*.xml",
      "/*.pdf",
      "/*.png",
      "/*.jpg",
      "/*.gif",
      "/*.svg",
      "/*.ico",
      "/*.webmanifest",
      "/*.txt",
      "/*.map"
    ]
  },
  "routes": [
    {
      "route": "/pensieve/*",
      "headers": {
        "Cache-Control": "public, max-age=0, must-revalidate"
      }
    }
  ],
  "responseOverrides": {
    "404": {
      "rewrite": "/404.html"
    }
  },
  "globalHeaders": {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "public, max-age=3600"
  }
}
```

### What Each Section Does

| Section              | Purpose                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `navigationFallback` | For any URL that doesn't match a static file, serve `index.html` (enables client-side routing for Gatsby) |
| `exclude`            | File patterns to serve directly instead of falling back (images, JS, CSS, etc.)                           |
| `routes`             | Custom headers/redirects for specific URL patterns                                                        |
| `responseOverrides`  | Custom error pages (e.g., show Gatsby's 404 page for missing routes)                                      |
| `globalHeaders`      | Security and caching headers applied to all responses                                                     |

### Important: `navigationFallback` for Deep Links

Without `navigationFallback`, if a user directly navigates to `aniketbiswas.dev/ETA`
(types it in the browser or shares the link), Azure SWA looks for a file at
`/ETA/index.html`. If it exists (because Gatsby built it), great. If not, it
returns a 404.

With `navigationFallback`, SWA falls back to `/index.html` for any unmatched
route, letting Gatsby's client-side router handle it.

**However**, since Gatsby is a static site generator that pre-builds all pages,
the best approach is: **make sure every route has a corresponding static HTML
file**. The `navigationFallback` is a safety net, not the primary routing mechanism.

---

## How URL Routing Works (Gatsby + SWA)

### The Two-Layer Routing Model

```
User requests: aniketbiswas.dev/ETA
                    │
                    ▼
    ┌──────────────────────────────┐
    │  Azure SWA Routing Engine    │
    │                              │
    │  1. Does /ETA/index.html     │
    │     exist in deployed files? │
    │     YES → serve it ✅        │
    │     NO  → ▼                  │
    │                              │
    │  2. navigationFallback set?  │
    │     YES → serve /index.html  │
    │     NO  → return 404 ❌      │
    └──────────────────────────────┘
                    │
                    ▼ (if index.html served)
    ┌──────────────────────────────┐
    │  Gatsby Client-Side Router   │
    │                              │
    │  Does React route for /ETA   │
    │  exist?                      │
    │  YES → render it ✅          │
    │  NO  → show 404 page ❌      │
    └──────────────────────────────┘
```

### Current Route Structure

| URL Path                | Source                                    |
| ----------------------- | ----------------------------------------- |
| `/`                     | `src/pages/index.js`                      |
| `/404`                  | `src/pages/404.js`                        |
| `/pensieve/`            | `src/pages/pensieve/index.js`             |
| `/pensieve/tags/`       | `src/pages/pensieve/tags.js`              |
| `/pensieve/<slug>`      | Programmatic via `gatsby-node.js` (posts) |
| `/pensieve/tags/<tag>/` | Programmatic via `gatsby-node.js` (tags)  |

### Two Ways Gatsby Creates Routes

1. **File-based routing** — Any `.js` file in `src/pages/` automatically becomes a page:

   - `src/pages/foo.js` → `/foo` → builds `public/foo/index.html`
   - `src/pages/bar/index.js` → `/bar/` → builds `public/bar/index.html`

2. **Programmatic routing** — Pages created via `createPage()` in `gatsby-node.js`:
   - Blog posts get paths from their `slug` frontmatter field
   - Tag pages get paths like `/pensieve/tags/<tag-name>/`

### Fragment Links (Hash Anchors)

The main page uses fragment links for section navigation (NOT separate routes):

```
aniketbiswas.dev/#about
aniketbiswas.dev/#jobs
aniketbiswas.dev/#projects
aniketbiswas.dev/#blogs
aniketbiswas.dev/#certifications
aniketbiswas.dev/#contact
```

These scroll to sections on the single-page index. The `#` fragment is handled
entirely by the browser — it never hits the server/SWA routing engine.

---

## Adding a New Route (e.g. `/ETA`)

You have **three options** depending on what `/ETA` should be:

### Option A: Static Page (New React Component) ⭐ Recommended

Best for: a standalone page with custom UI.

1. **Create the page file:**

   ```
   src/pages/ETA.js
   ```

   ```jsx
   import React from 'react';
   import { Layout } from '@components';

   const ETAPage = ({ location }) => (
     <Layout location={location}>
       <main className="fillHeight">
         <h1>ETA Page</h1>
         <p>Your content here.</p>
       </main>
     </Layout>
   );

   export default ETAPage;
   ```

2. **Build & deploy:**

   ```bash
   gatsby clean && gatsby build
   ```

   Then deploy `public/` via the VS Code Azure Extension.

3. **Result:**
   - Gatsby generates `public/ETA/index.html`
   - Azure SWA serves it at `aniketbiswas.dev/ETA`
   - ✅ No Azure config changes needed

> **Note**: Gatsby lowercases page filenames by default on some systems.
> `src/pages/ETA.js` may produce `/eta`. To guarantee the exact casing,
> use programmatic page creation in `gatsby-node.js` (see Option B).

### Option B: Markdown-Driven Page (via gatsby-node.js)

Best for: content-driven pages or guaranteed URL paths.

1. **Create a markdown file** (e.g., `content/pages/ETA.md`):

   ```markdown
   ---
   title: ETA
   slug: /ETA
   date: '2026-02-19'
   ---

   Your markdown content here.
   ```

2. **Add a template** (e.g., `src/templates/page.js`).

3. **Update `gatsby-node.js`** to query and create pages from the new source.

4. **Build & deploy** as usual.

### Option C: Redirect (via staticwebapp.config.json)

Best for: redirecting `/ETA` to an external URL without any Gatsby page.

Add a route rule to `static/staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/ETA",
      "redirect": "https://your-target-url.com",
      "statusCode": 301
    }
  ]
}
```

This is handled **entirely by Azure SWA** at the server level — no Gatsby page needed.

### Option D: Serve a Static File at a Path

Best for: serving a standalone HTML file, PDF, or slide deck.

1. Place the file in `static/`:

   ```
   static/ETA/index.html
   ```

2. Gatsby copies it as-is to `public/ETA/index.html` during build.

3. Azure SWA serves it at `aniketbiswas.dev/ETA`.

### ✅ Summary: What to Do for a New Route

| Scenario                       | Method                          | Azure Changes?     |
| ------------------------------ | ------------------------------- | ------------------ |
| New React page                 | Create `src/pages/X.js`         | None               |
| Content from Markdown          | Create `.md` + `gatsby-node.js` | None               |
| Redirect to external URL       | Add route in SWA config         | None (config only) |
| Serve a static file (HTML/PDF) | Drop file in `static/`          | None               |

**In all cases, Azure DNS and SWA custom domain settings stay unchanged.
Routing is handled by the combination of Gatsby's build output + SWA's config.**

---

## Existing Routes

### Main Pages

| URL                               | Description             |
| --------------------------------- | ----------------------- |
| `aniketbiswas.dev/`               | Homepage (all sections) |
| `aniketbiswas.dev/pensieve/`      | Blog index              |
| `aniketbiswas.dev/pensieve/tags/` | Tag listing             |

### Blog Posts

| URL                                                 |
| --------------------------------------------------- |
| `aniketbiswas.dev/pensieve/medium-articles`         |
| `aniketbiswas.dev/pensieve/dark-mode-toggle`        |
| `aniketbiswas.dev/pensieve/clickable-cards`         |
| `aniketbiswas.dev/pensieve/docker-error`            |
| `aniketbiswas.dev/pensieve/markdown-playground`     |
| `aniketbiswas.dev/pensieve/wordpress-publish-error` |

### Tag Pages

| URL                                                    |
| ------------------------------------------------------ |
| `aniketbiswas.dev/pensieve/tags/accessibility/`        |
| `aniketbiswas.dev/pensieve/tags/css/`                  |
| `aniketbiswas.dev/pensieve/tags/dark-mode/`            |
| `aniketbiswas.dev/pensieve/tags/docker/`               |
| `aniketbiswas.dev/pensieve/tags/medium/`               |
| `aniketbiswas.dev/pensieve/tags/software-development/` |
| ... and more (see `public/sitemap/sitemap-0.xml`)      |

### Static Files

| URL                           | Source              |
| ----------------------------- | ------------------- |
| `aniketbiswas.dev/resume.pdf` | `static/resume.pdf` |
| `aniketbiswas.dev/slides/*`   | `static/slides/`    |

### Fragment Links (sections on homepage)

| Fragment                           | Section        |
| ---------------------------------- | -------------- |
| `aniketbiswas.dev/#about`          | About          |
| `aniketbiswas.dev/#jobs`           | Experience     |
| `aniketbiswas.dev/#projects`       | Work/Projects  |
| `aniketbiswas.dev/#blogs`          | Blogs          |
| `aniketbiswas.dev/#certifications` | Certifications |
| `aniketbiswas.dev/#contact`        | Contact        |

---

## Troubleshooting

### New page returns 404 after deploy

1. **Verify the file was built:** Run `gatsby build` and check if `public/<path>/index.html` exists
2. **Check SWA config:** Make sure `staticwebapp.config.json` has `navigationFallback` set
3. **Redeploy:** Sometimes SWA caches the previous deployment; re-deploy via VS Code
4. **Wait 1–2 minutes** for global CDN propagation

### Direct URL navigation returns 404 (but works from homepage)

This means the static HTML file wasn't generated by Gatsby.

- If the page is created in `src/pages/`, verify the file name matches the URL
- If programmatic (via `gatsby-node.js`), check the `createPage` path
- As a safety net, ensure `navigationFallback` → `/index.html` in `staticwebapp.config.json`

### Custom domain not working

1. **Verify in Azure Portal:** Static Web Apps → Custom domains → Status should be "Ready"
2. **Check DNS records:**
   ```bash
   dig aniketbiswas.dev CNAME +short
   dig aniketbiswas.dev A +short
   nslookup aniketbiswas.dev
   ```
3. **Check validation:** Azure may require a TXT record for initial domain verification
4. **Apex domain issues:** If using an apex domain (`aniketbiswas.dev` without `www`), ensure your DNS provider supports ALIAS/ANAME records

### HTTPS certificate issues

1. Azure SWA auto-provisions Let's Encrypt certificates
2. After adding a custom domain, cert provisioning can take **up to 24 hours**
3. Check status at: Azure Portal → Static Web Apps → Custom domains → SSL state
4. If stuck, remove and re-add the custom domain

### Changes not appearing after deploy

1. **Hard refresh:** `Cmd + Shift + R` in the browser
2. **Check deployment:** Azure Portal → Static Web Apps → Overview → last deployment timestamp
3. **Clear Gatsby cache:** `gatsby clean && gatsby build` before redeploying
4. **CDN cache:** Azure SWA uses a global CDN; changes may take a few minutes to propagate
5. **Check the right folder:** Make sure you deployed `public/` (not the project root)

### Azure SWA Deployment Token

If the VS Code extension asks for a deployment token:

```
Azure Portal → Static Web Apps → <your-app> → Settings → Deployment token → Copy
```

Use this token when connecting the VS Code extension to your SWA resource.
