# Azure Front Door + Blob Storage

Deployment and domain guide for `aniketbiswas.dev`.

> Hosting configuration verified in Azure on September 12, 2026.

## LoanLens standalone calculator

The public address is **https://www.aniketbiswas.dev/loanlens**. Both `/loanlens`
and `/loanlens/` serve the calculator directly, without redirecting to a file
URL. The existing `/tools/loanlens/index.html` and `/tools/loanlens/` addresses
remain available.

LoanLens now has separate source/build ownership in the private
`aniketbiswas/loanlens` repository and a dedicated Storage origin. See
[RELEASE.md](RELEASE.md) for deployment identities, the traffic approval gate,
cached-client compatibility, and version-2-safe rollback.

Portfolio builds no longer copy the calculator or generate its friendly HTML.
They fail if either LoanLens namespace is present in source/output. The
featured project metadata and native `<a href="/loanlens">` remain; do not use
a Gatsby `Link` or import calculator styles/scripts into the portfolio.

Removing source is **not** authorization to delete old deployed blobs.
Preserve both calculator prefixes in `aniketwebsiteblob/$web`, all cached
unversioned modules, and prior immutable releases. Do not deploy this older
portfolio build as part of separating LoanLens.

The separate application keeps its early `<base href="/tools/loanlens/">`,
same-document fragment handling, browser storage and lock namespace, opt-in
financial saving, and no analytics/third-party resources. Both existing www
and apex hostnames remain reachable without storage migration or redirects.
Storage ignores SWA configuration: the retained fallback exclusions in that file
do not create Front Door routes or configure response security headers.

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
npm run check:site -- http://127.0.0.1:9000 --portfolio-only
```

This checks the actual production HTML and asset response types, not just whether the server
returns HTTP 200. The homepage, résumé, social preview image, Playground index, and Liquid
Typography page must all resolve correctly. The separate LoanLens origin is not included in
this local portfolio build. Default public checks still include both clean LoanLens addresses.
HTTP previews skip certificate validation.

## Publish reviewed output

Review the local changes and complete the production checks before publishing:

```sh
npm run test:release
npm run release:plan
```

The plan contains only portfolio output and refuses LoanLens namespaces, including stale
files. Follow [RELEASE.md](RELEASE.md) for separately approved, conditional uploads to
`aniketwebsiteblob/$web` using `--auth-mode login`. Back up replaced documents and stop
on ETag conflicts. Do not bulk overwrite, sync/delete absent files, change old LoanLens blobs,
or publish the repository root, local configuration, or credentials. If scoped data-plane
access is denied, resolve the deployment identity rather than retrieving account keys.

For a separately approved portfolio hosting update after uploading the generated `404.html`,
Storage can serve it for missing paths:

```sh
az storage blob service-properties update \
  --account-name aniketwebsiteblob \
  --auth-mode login \
  --static-website true \
  --index-document index.html \
  --404-document 404.html
```

Keep `index.html` as the directory index, not the error document. Gatsby routes and LoanLens
have generated index files on their respective origins; unknown paths should return HTTP 404
with the actual not-found page instead of the homepage.

Preserve the existing default Front Door route and portfolio origin configuration. For new Gatsby pages, verify
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
