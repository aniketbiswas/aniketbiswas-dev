# Portfolio and LoanLens release ownership

The portfolio and LoanLens share public hostnames, not deployment ownership.
LoanLens source, tests, build and releases belong to the private
`aniketbiswas/loanlens` repository. Only its built public assets are published.
The portfolio retains `content/featured/LoanLens/index.md` and its native
`<a href="/loanlens">` link; do not replace it with a Gatsby page-data link.

## Portfolio release gate

Use Node 22. `npm run test:release` runs the native Node ownership tests.
Gatsby checks `static/` before copying and `public/` after building, rejecting
either LoanLens namespace, including stale output from a previous checkout.
It never deletes those directories for you. Use a fresh build directory or
`gatsby clean` in your own isolated checkout, not another developer's worktree.

```sh
npm run build
npm run release:plan
```

The plan reads `public/` and prints paths, byte sizes and SHA-256 hashes. It
does not upload, delete, purge, change Azure settings or accept `--apply`.
`npm run deploy` deliberately refuses ambiguous deployment. The explicitly
named `deploy:github-pages` command is legacy, not Azure; its additive publish
preserves old remote assets.

Any separately approved Azure portfolio uploader must use only this reviewed
plan's files and conditional writes to `aniketwebsiteblob/$web`. **Never use
sync/delete, upload an old whole-site build, or interpret removed source files
as a remote deletion list.** Always preserve:

- `loanlens`, `loanlens/**`, `tools/loanlens`, `tools/loanlens/**`;
- all previous LoanLens runtime releases and cached unversioned assets;
- old Gatsby chunks still referenced by cached portfolio pages.

This change does not publish the homepage, merge unrelated pending portfolio
fixes, withdraw content, or delete any old-origin blob. The former source
removal is a repository ownership change only.

## Dedicated LoanLens deployment

Subscription: `005d1e2e-2c33-4ea4-882c-e19e36a21df1`; tenant:
`16bece6f-ddd8-4ed3-8c44-14ecae36850f`; resource group:
`portfolio-website-rg` (`southindia`). Dedicated Storage account:
`aniketloanlensblob`, Standard_LRS, HTTPS/TLS 1.2, shared-key access disabled.
Static website assets are public; Blob container anonymous access is disabled.
Do not upload repository files, financial data, browser profiles or private
extension artifacts.

The separate repository's explicit deployment workflow uses GitHub OIDC,
environment `production`, main-branch-only deployments, and a deployment
identity restricted to that account's `$web` container. It has no Front Door,
portfolio account or subscription-management permissions. Account identifiers
are variables, never account keys or client secrets.

Publish complete immutable graphs under
`tools/loanlens/releases/<runtime-sha256>/` first and verify every hash and MIME
type. Then conditionally publish both entry documents with `no-cache`.
Immutable assets use `public, max-age=31536000, immutable`. Preserve all
previous runtime graphs and the byte-identical original unversioned graph.
Do not overwrite old unversioned modules with new source.

The document base stays `/tools/loanlens/`, never the release directory.
The storage key and Web Lock remain
`home-loan-lab:v1:/tools/loanlens/`; the theme key remains
`home-loan-lab:theme:v1:/tools/loanlens/`. Plan JSON version 2 is separate from
the storage namespace. Preserve v1 import, opt-in saving, exact months/paise,
v2 export/import, and old-client rejection of upgraded records.

## Traffic boundary and approval

Existing Front Door profile `aniketwebsite-fd`, endpoint `aniketwebsite`, and
its `default-route` (`/*`) remain unchanged. A separately approved LoanLens
route selects only `/loanlens`, `/loanlens/`, `/loanlens/index.html`,
`/tools/loanlens`, and `/tools/loanlens/*`, on both existing www and apex domains
and the existing endpoint hostname. No DNS or apex-to-www redirect is needed.
`/loanlens-other` and unrelated paths must still use the portfolio route.
The new origin Host header must equal its Storage static-website hostname.
Storage directory indexes provide friendly entry behavior without a SPA
fallback; missing files must be genuine 404s.

Before cutover, retain live entry bytes/headers, the exact old blob-prefix
inventory/metadata, default-route/origin/rule configuration, and homepage
hashes. Stage and verify only the new origin. Obtain explicit coordinator
approval before activating routes. Do not use broad cache purges.

## Rollback phases

**Before any public version-2 exposure:** abandoning an unused new origin or
an unactivated route is safe. The old portfolio origin remains unchanged.

**After cutover/version-2 saves are possible:** deleting/disabling the new
route would fall through to the old version-1-only UI and is **not a safe
rollback**. Keep a complete, known-good version-2-aware runtime and both
matching entry documents in the dedicated origin. Restore only those
documents with reviewed ETags, retaining every graph and old unversioned asset.
For route configuration recovery, restore the captured known-good LoanLens
route/origin binding, not the old wildcard-only routing.

If the dedicated Storage origin is unavailable, do not pretend the old
version-1 origin is a recovery target. Restore that origin or separately
provision a version-2-capable recovery origin before switching traffic. Never
modify the old portfolio blobs to manufacture fallback, downgrade or clear
saved data, or advise users to clear storage after a format mismatch. Old
cached tabs may need reloading. Explicit user-confirmed deletion in an already
cached old client cannot be revoked by deployment.

Keep the original portfolio origin/blobs and all rollback evidence. A source
PR is not evidence of propagation; verify exact public aliases, graph hashes,
headers, synthetic imports/saves and the unchanged homepage after cutover.
