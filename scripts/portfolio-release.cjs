const { createHash } = require('node:crypto');
const { readdir, readFile } = require('node:fs/promises');
const path = require('node:path');

const isLoanLensPath = name => /^(?:loanlens|tools\/loanlens)(?:\/|$)/i.test(name);

async function assertPortfolioTree(root) {
  const files = [];
  async function walk(directory, prefix) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const name = prefix + entry.name;
      if (isLoanLensPath(name)) {
        throw new Error(
          `LoanLens is owned by aniketbiswas/loanlens, not this release: ${name}. ` +
            'Use a clean portfolio build; never delete deployed LoanLens blobs.',
        );
      }
      if (entry.isSymbolicLink()) throw new Error(`Release symlink is not allowed: ${name}`);
      if (entry.isDirectory()) {
        await walk(path.join(directory, entry.name), `${name}/`);
      } else if (entry.isFile()) {
        files.push(name);
      } else {
        throw new Error(`Unsupported release entry: ${name}`);
      }
    }
  }
  await walk(root, '');
  return files;
}

async function planPortfolioRelease(root) {
  const names = await assertPortfolioTree(root);
  if (!names.includes('index.html')) throw new Error('Portfolio output requires index.html.');
  const uploads = [];
  for (const name of names) {
    const contents = await readFile(path.join(root, name));
    uploads.push({
      path: name,
      bytes: contents.length,
      sha256: createHash('sha256').update(contents).digest('hex'),
    });
  }
  return {
    mode: 'dry-run',
    cloudMutations: false,
    target: { account: 'aniketwebsiteblob', container: '$web' },
    uploads,
    deletions: [],
    preserveDeployed: ['loanlens', 'loanlens/**', 'tools/loanlens', 'tools/loanlens/**'],
    requirements: [
      'Review this exact portfolio build separately; this is not an Azure uploader.',
      'Never sync/delete remote blobs missing from this build or overwrite LoanLens paths.',
      'Retain old Gatsby chunks and all LoanLens entries, unversioned assets and release graphs.',
      'Verify live identity and ETags before separately approved conditional uploads.',
    ],
  };
}

module.exports = { isLoanLensPath, assertPortfolioTree, planPortfolioRelease };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0].startsWith('-'))) {
    console.error(
      'No automatic Azure deploy is configured. Run npm run release:plan [-- public-directory] ' +
        'and follow docs/RELEASE.md. --apply is not supported.',
    );
    process.exitCode = 1;
  } else {
    planPortfolioRelease(path.resolve(args[0] || 'public')).then(
      plan => console.log(JSON.stringify(plan, null, 2)),
      error => {
        console.error(error.message);
        process.exitCode = 1;
      },
    );
  }
}
