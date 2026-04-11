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
  const requiredRoutes = ['/', '/photography', '/videography', '/about', '/services', '/project/toy', '/project/industry'];
  const missingRoutes = requiredRoutes.filter((route) => !sitemap.includes(`<loc>https://director.vision${route}</loc>`));
  addCheck('sitemap contains required routes', missingRoutes.length === 0, missingRoutes.join(', '));
  addCheck('sitemap has no localhost', !/localhost|127\.0\.0\.1/i.test(sitemap));
} else {
  addCheck('sitemap readable', false, 'public/sitemap.xml not readable');
}

// 3) App-level checks
const app = safeRead('src/App.jsx');
if (app) {
  checkIncludesAll('Route /services exists', app, ['path="/services"']);
  checkIncludesAll('SEO meta tags wired', app, ['og:url', 'twitter:card', 'twitter:title', 'twitter:description']);
  addCheck('Routes use Suspense boundary', app.includes('<Suspense'));
  addCheck('Routes use lazy loading', app.includes('const Photography = lazy('));
} else {
  addCheck('App.jsx readable', false, 'src/App.jsx not readable');
}

// 4) Nav + i18n checks
const nav = safeRead('src/components/NavBar.jsx');
if (nav) {
  addCheck('Nav contains services entry', nav.includes("{ key: 'services'"));
  addCheck('Nav has locale switch', nav.includes('switchLocale'));
} else {
  addCheck('NavBar.jsx readable', false, 'src/components/NavBar.jsx not readable');
}

const messages = safeRead('src/i18n/messages.js');
if (messages) {
  checkIncludesAll('i18n contains services labels', messages, ['services:', "services: '服务与交付'", "services: 'SERVICES'", "title: 'SERVICES & DELIVERABLES'"]);
} else {
  addCheck('messages.js readable', false, 'src/i18n/messages.js not readable');
}

// 5) Console checks
const consolePage = safeRead('src/pages/DirectorConsole/index.jsx');
if (consolePage) {
  checkIncludesAll('Console preflight + analytics KPI', consolePage, ['runProjectPreflight', 'ctaConversionRate', 'RUN PREFLIGHT']);
  checkIncludesAll('Console social proof config fields', consolePage, ['testimonialsText', 'brandNamesText', 'servicesText']);
} else {
  addCheck('DirectorConsole readable', false, 'src/pages/DirectorConsole/index.jsx not readable');
}

// 6) CTA checks
const cta = safeRead('src/components/ProjectCTA.jsx');
if (cta) {
  checkIncludesAll('CTA tracking wired', cta, ["trackEvent('cta_click'", "action: 'consult'", "action: 'proposal'", "action: 'copy_email'"]);
} else {
  addCheck('ProjectCTA readable', false, 'src/components/ProjectCTA.jsx not readable');
}

// 7) Config defaults sanity
const configCtx = safeRead('src/context/ConfigContext.jsx');
if (configCtx) {
  checkIncludesAll('Config defaults include trust/service fields', configCtx, ['testimonialsText', 'brandNamesText', 'servicesText']);
  addCheck('Config has contactEmail key', configCtx.includes('contactEmail'));
} else {
  addCheck('ConfigContext readable', false, 'src/context/ConfigContext.jsx not readable');
}

// 8) package script exists
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
