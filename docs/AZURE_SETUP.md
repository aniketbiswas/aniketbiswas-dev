# Azure Front Door + Blob Storage

Deployment and domain guide for `aniketbiswas.dev`.

> Hosting configuration verified in Azure on September 12, 2026.

## LoanLens standalone calculator

The public address is **https://www.aniketbiswas.dev/loanlens**. Both `/loanlens`
and `/loanlens/` serve the calculator directly, without redirecting to a file
URL. The existing `/tools/loanlens/index.html` and `/tools/loanlens/` addresses
remain available.

During `yarn build`, Gatsby copies `static/tools/loanlens/` unchanged into
`public/tools/loanlens/`. The `onPostBuild` hook in `gatsby-node.js` then generates
`public/loanlens/index.html` from that same source document; do not maintain a
second HTML copy. This entry sets an early `<base href="/tools/loanlens/">` so
all assets and `document.baseURI`-derived scenario/theme storage keys retain
their original namespace. Existing remembered plans and theme choices work
at either address without migration. Canonical and Open Graph URL metadata
point to `/loanlens`. A small inline script keeps fragment links, including
the skip link, on the current friendly page rather than the asset directory.
Any future Content Security Policy must permit the same-origin base and this
script. No CSP currently blocks them on the Storage/Front Door site.

The ten original HTML, CSS, JavaScript, SVG, and PNG files stay together.
No API, server, additional package, or Gatsby page is required.

`content/featured/LoanLens/index.md` adds a featured project using the existing
native `<a href="/loanlens">` convention. Do not
replace it with a Gatsby `Link`: this standalone document has no Gatsby
page-data. Its global styles and scripts must not be imported into the portfolio.

Calculations run locally with generic example inputs. `data-storage="browser"`
must remain on the HTML root. Financial scenario storage is opt-in; the
separate theme preference does not enable saving. The page loads no analytics
or third-party resources. Other scripts on the same origin can access browser
storage, so do not add session replay or tracking to this document.

For an initial calculator release, upload **only** the ten files from
`public/tools/loanlens/` to the matching `tools/loanlens/` prefix and the generated
`public/loanlens/index.html` to `loanlens/index.html` in the existing `$web`
container. If the original assets are already live and unchanged, adding the
friendly address requires uploading only `loanlens/index.html`. Storage's
existing directory-index behavior and Front Door wildcard route serve both
friendly paths; no routing infrastructure changes are needed.
Preserve all other blobs, including the live homepage.
Publish the featured project through a later, deliberate portfolio deployment;
the isolated upload does not update the homepage. Do not deploy an older full
portfolio build just to add this tool.

Set `.html` to `text/html`, `.css` to `text/css`, `.js` to `text/javascript`,
`.svg` to `image/svg+xml`, and `.png` to `image/png`. Check the exact public
URLs (with and without the trailing slash), reload, skip link, saved-plan/theme
compatibility, and supporting assets after upload, including the versioned icons.
The existing Front Door wildcard route serves the prefix without new
infrastructure. For a future SWA deployment, exact friendly routes rewrite to
the generated HTML and both calculator prefixes are excluded from the existing
navigation fallback without changing global site headers.

## Actual hosting architecture

```text
Namecheap DNS
    |
Azure Front Door (custom domains and managed HTTPS)
    |
Azure Storage static website ($web container)
    |
Gatsby production output (public/)
```

| Resource            | Verified value                                   |
| ------------------- | ------------------------------------------------ |
| Resource group      | `portfolio-website-rg`                           |
| Front Door profile  | `aniketwebsite-fd`                               |
| Front Door tier     | Standard                                         |
| Endpoint name       | `aniketwebsite`                                  |
| Endpoint hostname   | `aniketwebsite-d8angjb0deduc7dp.z01.azurefd.net` |
| Custom domains      | `aniketbiswas.dev`, `www.aniketbiswas.dev`       |
| Storage account     | `aniketwebsiteblob`                              |
| Origin hostname     | `aniketwebsiteblob.z30.web.core.windows.net`     |
| Origin group        | `default-origin-group-bada59b0`                  |
| Origin              | `default-origin`                                 |
| Published container | `$web`                                           |
| Authoritative DNS   | Namecheap                                        |

The configured route is `default-route`, matches `/*`, redirects HTTP to HTTPS, and uses the
`nocache` rule set. That rule set currently overrides caching; it does not rewrite URL paths.

This is **not an Azure Static Web Apps deployment**. The SWA extension, `swa deploy`, and
`staticwebapp.config.json` do not configure this Blob Storage / Front Door setup.

## Build and preview

Run commands from the repository root with the Node version in `.nvmrc`:

```sh
npm run test:site-health
npm run build:prod
npm run serve -- --host 127.0.0.1
```

In another terminal:

```sh
npm run check:site -- http://127.0.0.1:9000
```

This checks the actual production HTML and asset response types, not just whether the server
returns HTTP 200. The homepage, résumé, social preview image, Playground index, and Liquid
Typography page, and clean LoanLens addresses must all resolve correctly. HTTP previews skip
certificate validation.

## Publish reviewed output

Review the local changes and complete the production checks before publishing. Upload the
**contents of `public/` only** to the existing storage account's `$web` container.

For an authenticated account with the required Blob Storage data permissions:

```sh
az login
az storage blob upload-batch \
  --account-name aniketwebsiteblob \
  --auth-mode login \
  --destination '$web' \
  --source ./public \
  --overwrite true
```

This command replaces live files. It is not part of local development or the health workflow.
Do not upload the repository root, local configuration, or credentials. If data-plane access is
denied, use the existing authorized deployment workflow; do not place account keys in source.
If the authenticated deployment account already has permission to query the storage account key,
`--auth-mode key` lets Azure CLI obtain and use that key internally. Do not print or store the key
in repository files.

After uploading the generated `404.html`, configure Storage to serve it for missing paths:

```sh
az storage blob service-properties update \
  --account-name aniketwebsiteblob \
  --auth-mode login \
  --static-website true \
  --index-document index.html \
  --404-document 404.html
```

Keep `index.html` as the directory index, not the error document. Gatsby routes and the clean
LoanLens address have their own generated index files; unknown paths should return HTTP 404
with the actual not-found page instead of the homepage.

Preserve the existing Front Door route and origin configuration. For new Gatsby pages, verify
their direct URLs after deployment, including a fresh browser visit rather than only client-side
navigation. Directory/index handling and the storage account's error document must serve the
expected page; a generic HTML fallback is not proof that a route works.

After publishing:

```sh
npm run check:site
```

## Custom-domain certificate renewal

Front Door owns the HTTPS certificates. Inspect the custom domain on the Front Door profile,
not an unrelated Static Web App.

On September 12, the apex domain had an expired certificate and was marked
`PendingRevalidation`; `www.aniketbiswas.dev` was `Approved`. Regenerating the apex token and
updating only its Namecheap TXT record restored both domains to `Approved`. Azure then reported
a replacement apex certificate expiring March 12, 2027. Always verify the certificate actually
served at the edge before treating a renewal as complete.

### 1. Authenticate and inspect the exact domain

```sh
az login
az afd custom-domain show \
  --resource-group portfolio-website-rg \
  --profile-name aniketwebsite-fd \
  --custom-domain-name aniketbiswas-dev-3b95 \
  --query '{host:hostName,state:domainValidationState,validation:validationProperties}'
```

Confirm the selected subscription contains the verified portfolio resources before making a
change. If CLI authentication has expired, sign in again; a portal login alone does not refresh
the CLI session.

### 2. Generate a fresh token only when revalidation is required

```sh
az afd custom-domain regenerate-validation-token \
  --resource-group portfolio-website-rg \
  --profile-name aniketwebsite-fd \
  --custom-domain-name aniketbiswas-dev-3b95
```

Then run the `show` command again. Use its current `validationToken` and check its expiration
date. Do not reuse an expired token or regenerate it repeatedly while a DNS update is pending.

### 3. Update the specific Namecheap TXT record

In Namecheap, open **Domain List → Manage → Advanced DNS** for `aniketbiswas.dev`.

| Field | Value                                                                       |
| ----- | --------------------------------------------------------------------------- |
| Type  | TXT                                                                         |
| Host  | `_dnsauth`                                                                  |
| Value | The current `validationToken` returned by Azure, without surrounding quotes |
| TTL   | Automatic                                                                   |

Replace only the existing `_dnsauth` value. Preserve other DNS records and the approved `www`
binding. The observed authoritative nameservers are `dns1.registrar-servers.com` and
`dns2.registrar-servers.com`; `www` points to the verified Front Door endpoint.

```sh
dig +short TXT _dnsauth.aniketbiswas.dev
```

Allow for DNS cache expiry, Azure validation, certificate issuance, and edge deployment.
[Azure documents a deployment window of several minutes to an hour](https://learn.microsoft.com/azure/frontdoor/standard-premium/how-to-configure-https-custom-domain).
An `Approved` validation state alone does not prove that browsers are receiving the new certificate.
Verify HTTPS with normal certificate checking enabled:

```sh
curl --head https://aniketbiswas.dev
npm run check:site
```

Do not disable TLS verification, remove the live domain binding, or change the apex address to a
guessed IP as a workaround.

## Project links

The macOS project currently has no verified public demo or source URL. Its optional link fields
in [the project content](../content/featured/MacOSPlayground/index.md) are blank. Restore them
only when they lead to that actual project and pass DNS, HTTPS, and destination checks.

Do not point the missing demo hostname at the portfolio merely to make it return HTTP 200.

## Daily health checks

The [public website health workflow](../.github/workflows/site-health.yml) runs daily and on
demand after it is pushed to the default branch. It does not deploy the site.

The dependency-free checker verifies:

- Trusted HTTPS and at least 14 days of certificate validity.
- Successful responses for key pages and assets.
- Correct PDF/image content types.
- Page-specific HTML markers, catching incorrect routing fallbacks.
- Bounded redirects and request timeouts.

Enable GitHub Actions notifications for failed runs. A failed check reports the offending URL
or certificate problem; the underlying DNS or hosting issue must still be repaired.
