const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, mkdir, readFile, writeFile, rm, symlink } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const release = require('../scripts/portfolio-release.cjs');

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-release-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'index.html'), '<a href="/loanlens">LoanLens</a>');
  return root;
}

test('reserved paths are exact namespaces, including case-insensitive Front Door matches', () => {
  for (const name of ['loanlens', 'loanlens/index.html', 'tools/loanlens/app.js', 'LoanLens/x']) {
    assert.equal(release.isLoanLensPath(name), true, name);
  }
  for (const name of ['loanlens-other/index.html', 'tools/loanlens-other/app.js', 'index.html']) {
    assert.equal(release.isLoanLensPath(name), false, name);
  }
});

test('plan preserves remote LoanLens and contains only portfolio files', async t => {
  const root = await fixture(t);
  const plan = await release.planPortfolioRelease(root);
  assert.equal(plan.cloudMutations, false);
  assert.equal(plan.target.account, 'aniketwebsiteblob');
  assert.deepEqual(
    plan.uploads.map(file => file.path),
    ['index.html'],
  );
  assert.match(plan.uploads[0].sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(plan.deletions, []);
  assert.ok(plan.preserveDeployed.includes('tools/loanlens/**'));
  assert.match(await readFile(path.join(root, 'index.html'), 'utf8'), /href="\/loanlens"/);
});

for (const reserved of ['loanlens', 'tools/loanlens', 'tools/LoanLens']) {
  test(`rejects stale ${reserved} output without deleting it`, async t => {
    const root = await fixture(t);
    const directory = path.join(root, reserved);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'index.html'), 'cached release');
    await assert.rejects(release.planPortfolioRelease(root), /LoanLens is owned/);
    assert.equal(await readFile(path.join(directory, 'index.html'), 'utf8'), 'cached release');
  });
}

test('missing build and symlink output fail closed', async t => {
  const root = await fixture(t);
  await assert.rejects(release.planPortfolioRelease(path.join(root, 'absent')), /ENOENT/);
  await symlink(path.join(root, 'index.html'), path.join(root, 'alias.html'));
  await assert.rejects(release.planPortfolioRelease(root), /symlink/);
});

test('Gatsby guards source before copying and output after building, without generating a tool', async () => {
  const source = await readFile(path.join(__dirname, '../gatsby-node.js'), 'utf8');
  const checked = [];
  const api = {};
  vm.runInNewContext(source, {
    exports: api,
    __dirname: '/portfolio',
    require: name => {
      if (name === 'path') return path;
      if (name === 'lodash') return {};
      assert.equal(name, './scripts/portfolio-release.cjs');
      return { assertPortfolioTree: root => checked.push(root) };
    },
  });
  await api.onPreBootstrap();
  await api.onPostBuild();
  assert.deepEqual(checked, ['/portfolio/static', '/portfolio/public']);
  assert.doesNotMatch(source, /readFile|writeFile/);
});

test('repository retains public link and fallback exclusions, not calculator source', async () => {
  await release.assertPortfolioTree(path.join(__dirname, '../static'));
  const featured = await readFile(
    path.join(__dirname, '../content/featured/LoanLens/index.md'),
    'utf8',
  );
  assert.match(featured, /external: '\/loanlens'/);
  const config = JSON.parse(
    await readFile(path.join(__dirname, '../static/staticwebapp.config.json')),
  );
  assert.ok(config.navigationFallback.exclude.includes('/tools/loanlens/*'));
  assert.ok(config.navigationFallback.exclude.includes('/loanlens/*'));
  assert.equal(config.routes, undefined);
});

test('CLI refuses deployment/apply flags without cloud calls', () => {
  for (const flag of ['--apply', '--deployment-disabled']) {
    const result = spawnSync(process.execPath, [
      path.join(__dirname, '../scripts/portfolio-release.cjs'),
      flag,
    ]);
    assert.equal(result.status, 1);
    assert.match(result.stderr.toString(), /No automatic Azure deploy/);
  }
});
