import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execSync } from 'node:child_process';

const root = process.cwd();
const checks = [];
const isQuickMode = process.argv.includes('--quick');

function addCheck(name, pass, detail = '') {
  checks.push({ name, pass, detail });
}

function readText(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

function exists(filePath) {
  return fs.existsSync(path.join(root, filePath));
}

function safeRead(filePath) {
  try {
    return readText(filePath);
  } catch {
    return null;
  }
}

function parseJson(filePath) {
  const raw = readText(filePath);
  return JSON.parse(raw);
}

function checkIncludesAll(name, source, needles) {
  const missing = needles.filter((item) => !source.includes(item));
  addCheck(name, missing.length === 0, missing.length > 0 ? `missing: ${missing.join(', ')}` : '');
}

// 1) Build must pass (skip in quick mode)
if (isQuickMode) {
  addCheck('Build', true, 'skipped in quick mode');
} else {
  try {
    execSync('npm run build', { stdio: 'pipe' });
    addCheck('Build', true, 'npm run build passed');
  } catch (error) {
    addCheck('Build', false, String(error?.message || 'build failed'));
  }
}

// 2) Required public files
addCheck('robots.txt exists', exists('public/robots.txt'));
addCheck('sitemap.xml exists', exists('public/sitemap.xml'));

const robots = safeRead('public/robots.txt');
const sitemap = safeRead('public/sitemap.xml');

if (robots) {
  addCheck('robots includes User-agent', robots.includes('User-agent: *'));
  addCheck('robots includes Allow root', robots.includes('Allow: /'));
  addCheck('robots includes sitemap url', /Sitemap:\s*https?:\/\//i.test(robots));
} else {
  addCheck('robots readable', false, 'public/robots.txt not readable');
}

if (sitemap) {
  const requiredRoutes = ['/', '/images', '/videos', '/about', '/client-access'];
  const missingRoutes = requiredRoutes.filter((route) => !sitemap.includes(`<loc>https://director.vision${route}</loc>`));
  addCheck('sitemap contains required routes', missingRoutes.length === 0, missingRoutes.join(', '));
  addCheck('sitemap has no localhost', !/localhost|127\.0\.0\.1/i.test(sitemap));
  addCheck('sitemap has no legacy routes', !/photography|videography|\/services|\/project\//.test(sitemap));
} else {
  addCheck('sitemap readable', false, 'public/sitemap.xml not readable');
}

// 3) App-level checks (routes mirror src/App.jsx)
const app = safeRead('src/App.jsx');
if (app) {
  checkIncludesAll('App routes wired', app, [
    'path="/"',
    'path="/images"',
    'path="/videos"',
    'path="/about"',
    'path="/studio-notes"',
    'path="/client-access"',
    'path="/client-deliverables/:id"',
    'path="/console"',
  ]);
} else {
  addCheck('App.jsx readable', false, 'src/App.jsx not readable');
}

// 4) index.html SEO essentials
const html = safeRead('index.html');
if (html) {
  checkIncludesAll('index.html essentials', html, ['<meta charset', 'name="viewport"', '<title>', 'href="/favicon.svg"']);
  addCheck('index.html lang set', /<html lang="[a-zA-Z-]+">/.test(html));
} else {
  addCheck('index.html readable', false, 'index.html not readable');
}

// 5) Nav checks (MinimalTopNav is the active primary nav)
const topNav = safeRead('src/components/MinimalTopNav.jsx');
if (topNav) {
  checkIncludesAll('MinimalTopNav primary links', topNav, ["to: '/'", "to: '/images'", "to: '/videos'", "to: '/about'", "to: '/client-access'"]);
} else {
  addCheck('MinimalTopNav readable', false, 'src/components/MinimalTopNav.jsx not readable');
}

// 6) i18n checks
const messages = safeRead('src/i18n/messages.js');
if (messages) {
  checkIncludesAll('i18n bundles locale files', messages, ['./en.js', './zh.js']);
} else {
  addCheck('messages.js readable', false, 'src/i18n/messages.js not readable');
}

// 7) Console checks
if (exists('src/pages/console/index.jsx')) {
  const consoleIndex = safeRead('src/pages/console/index.jsx');
  addCheck('Console renders panel shell', Boolean(consoleIndex) && consoleIndex.includes('ConsolePanelShell'));
} else {
  addCheck('Console page exists', false, 'src/pages/console/index.jsx not found');
}
checkIncludesAll('Console panels exist', [
  exists('src/pages/console/ProjectsPanel.jsx') ? 'ProjectsPanel' : '',
  exists('src/pages/console/HomepageVideoPanel.jsx') ? 'HomepageVideoPanel' : '',
  exists('src/pages/console/PrivateDeliverablesPanel.jsx') ? 'PrivateDeliverablesPanel' : '',
].join(''), ['ProjectsPanel', 'HomepageVideoPanel', 'PrivateDeliverablesPanel']);

// 8) CTA tracking checks
const cta = safeRead('src/components/ProjectCTA.jsx');
if (cta) {
  checkIncludesAll('CTA tracking wired', cta, ["trackEvent('cta_click'", "action: 'consult'", "action: 'proposal'", "action: 'copy_email'"]);
} else {
  addCheck('ProjectCTA readable', false, 'src/components/ProjectCTA.jsx not readable');
}

// 9) Config defaults sanity
const configDefaults = safeRead('src/context/configDefaults.js');
if (configDefaults) {
  checkIncludesAll('Config defaults include trust/service fields', configDefaults, ['testimonialsText', 'brandNamesText', 'servicesText']);
  addCheck('Config has contactEmail key', configDefaults.includes('contactEmail'));
} else {
  addCheck('configDefaults readable', false, 'src/context/configDefaults.js not readable');
}

// 10) Server security regression checks (write endpoints must stay authenticated)
const authMw = safeRead('server/src/middlewares/auth.middleware.js');
if (authMw) {
  checkIncludesAll('Dual-credential auth middleware exports', authMw, ['createAdminAuthMiddleware', 'createWriteAuthMiddleware', 'createOptionalAuthMiddleware', 'createClientToken']);
} else {
  addCheck('auth.middleware.js exists', false, 'server/src/middlewares/auth.middleware.js not found');
}
addCheck('error.middleware.js exists', exists('server/src/middlewares/error.middleware.js'));
addCheck('server lint clean', (() => {
  try {
    execSync('npx eslint server/src', { stdio: 'pipe' });
    return true;
  } catch (error) {
    addCheck('server lint detail', false, String(error?.message || 'lint failed'));
    return false;
  }
})());

const protectedWrites = [
  ['server/src/routes/projects.routes.js', 'writeAuth', ['router.post', 'router.put', 'router.delete']],
  ['server/src/routes/config.routes.js', 'authMiddleware', ['router.post', 'router.put']],
  ['server/src/routes/upload.routes.js', 'writeAuth', ['router.post']],
  ['server/src/routes/sync.routes.js', 'writeAuth', ['router.post']],
  ['server/src/routes/media.routes.js', 'writeAuth', ['router.post']],
  ['server/src/routes/translation-review.routes.js', 'writeAuth', ['router.post', 'router.patch']],
  ['server/src/routes/unlocks.routes.js', 'writeAuth', ['router.post']],
  ['server/src/routes/healthcheck.routes.js', 'writeAuth', ['router.delete']],
];
for (const [filePath, guard, writeVerbs] of protectedWrites) {
  const source = safeRead(filePath);
  if (!source) {
    addCheck(`${filePath} readable`, false);
    continue;
  }
  const unguarded = writeVerbs.filter((verb) => {
    const lines = source.split('\n').filter((line) => line.includes(verb));
    return lines.some((line) => !line.includes(guard) && !line.includes(`//`));
  });
  addCheck(`${filePath} write routes guarded`, unguarded.length === 0, unguarded.length > 0 ? `unguarded: ${unguarded.join(', ')}` : '');
}

// 11) package script exists
try {
  const pkg = parseJson('package.json');
  addCheck('package preflight script exists', typeof pkg?.scripts?.preflight === 'string');
} catch {
  addCheck('package.json readable', false, 'package.json parse failed');
}

const passed = checks.filter((x) => x.pass).length;
const failed = checks.length - passed;

console.log('=== PRE-DEPLOY CHECK (STRICT) ===');
checks.forEach((item) => {
  const mark = item.pass ? 'PASS' : 'FAIL';
  const extra = item.detail ? ` (${item.detail})` : '';
  console.log(`[${mark}] ${item.name}${extra}`);
});
console.log('---------------------------------');
console.log(`Result: ${passed}/${checks.length} passed, ${failed} failed`);

if (failed > 0) process.exit(1);
