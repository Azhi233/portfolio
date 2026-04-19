import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const scriptRoot = path.join(root, 'scripts');
const results = [];
const jsonOutput = process.argv.includes('--json');
const keepTestFiles = process.argv.includes('--keep-test-files');
const openPage = process.argv.includes('--open-page');
const reportDirArgIndex = process.argv.indexOf('--report-dir');
const reportDir = reportDirArgIndex >= 0 ? process.argv[reportDirArgIndex + 1] : path.join(scriptRoot, 'healthcheck-reports');
const rootEnv = parseEnvFile('.env');
const serverEnv = parseEnvFile('server/.env');
const apiBaseUrl = (() => {
  const candidate = String(rootEnv.VITE_API_BASE_URL || rootEnv.VITE_API_URL || 'http://localhost:8788/api').trim();
  const port = serverEnv.PORT || 8788;
  if (/^https?:\/\//i.test(candidate)) return candidate.replace(/\/+$/, '');
  if (candidate.startsWith('/')) return `http://localhost:${port}${candidate}`.replace(/\/+$/, '');
  return `http://localhost:${port}/${candidate}`.replace(/\/+$/, '');
})();
const testPrefix = 'portfolio/healthcheck';
const trackedObjects = [];
const testFiles = [
  { name: 'healthcheck-image.png', kind: 'image', type: 'image/png', text: 'healthcheck image' },
  { name: 'healthcheck-video.mp4', kind: 'video', type: 'video/mp4', text: 'healthcheck video' },
];

function addResult(name, pass, detail = '', severity = 'required') {
  results.push({ name, pass, detail, severity });
  return pass;
}

function readText(filePath) { return fs.readFileSync(path.join(root, filePath), 'utf8'); }
function exists(filePath) { return fs.existsSync(path.join(root, filePath)); }

function parseEnvFile(filePath) {
  const full = path.join(root, filePath);
  if (!fs.existsSync(full)) return {};
  const text = fs.readFileSync(full, 'utf8');
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd || root, encoding: 'utf8', windowsHide: true, shell: false, timeout: options.timeout || 120000 });
  return { ok: result.status === 0, stdout: result.stdout || '', stderr: result.stderr || '', status: result.status, error: result.error?.message || '' };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return { ok: response.ok, status: response.status, data, text };
}

function normalizeObjectNameFromResponse(responseData = {}, fallbackUrl = '') {
  if (responseData.objectName) return String(responseData.objectName);
  if (responseData.targetUrl) {
    try {
      const url = new URL(responseData.targetUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      return parts.slice(1).join('/');
    } catch {
      return '';
    }
  }
  if (responseData.url) {
    try {
      const url = new URL(responseData.url);
      const parts = url.pathname.split('/').filter(Boolean);
      return parts.slice(1).join('/');
    } catch {
      return '';
    }
  }
  if (fallbackUrl) {
    try {
      const url = new URL(fallbackUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      return parts.slice(1).join('/');
    } catch {
      return '';
    }
  }
  return '';
}

async function fetchText(url, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text, headers: Object.fromEntries(response.headers.entries()) };
  } finally {
    clearTimeout(timer);
  }
}

function ensureReportDir() { fs.mkdirSync(reportDir, { recursive: true }); }
function writeReports(summary) {
  ensureReportDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const mdPath = path.join(reportDir, `healthcheck-${stamp}.md`);
  const jsonPath = path.join(reportDir, `healthcheck-${stamp}.json`);
  const md = [
    '# Health Check Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- OK: ${summary.ok}`,
    `- Passed: ${summary.passed}`,
    `- Failed: ${summary.failed}`,
    `- Total: ${summary.total}`,
    '',
    '## Results',
    ...summary.results.map((item) => `- [${item.pass ? 'x' : ' '}] ${item.name}${item.detail ? ` — ${item.detail}` : ''}`),
  ].join('\n');
  fs.writeFileSync(mdPath, md, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');
  return { mdPath, jsonPath };
}

function createBlob(text, type) {
  return new Blob([text], { type });
}

function buildHealthcheckObjectName(fileName) {
  return `${testPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fileName}`;
}

function parseObjectNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, '').split('/').slice(1).join('/');
  } catch {
    return '';
  }
}

async function deleteTrackedObjects() {
  const cleanupResults = [];
  for (const item of trackedObjects) {
    try {
      const response = await fetchJson(`${apiBaseUrl.replace(/\/+$/, '')}/healthcheck/minio-object`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketName: item.bucketName, objectName: item.objectName }),
      });
      cleanupResults.push(response.ok ? `deleted ${item.objectName}` : `failed ${item.objectName}`);
    } catch (error) {
      cleanupResults.push(`failed ${item.objectName}: ${error?.message || 'unknown error'}`);
    }
  }
  return cleanupResults;
}

async function runUploadTests() {
  const uploadUrl = `${apiBaseUrl.replace(/\/+$/, '')}/uploads`;
  for (const file of testFiles) {
    const form = new FormData();
    form.append('type', 'public');
    form.append('file', createBlob(file.text, file.type), file.name);
    const response = await fetchJson(uploadUrl, { method: 'POST', body: form });
    addResult(`upload ${file.kind} test`, response.ok, response.ok ? `HTTP ${response.status}` : `HTTP ${response.status} ${response.text}`, 'required');

    const data = response.data?.data || response.data || {};
    const bucketName = data.bucketName || 'public-assets';

    if (file.kind === 'video') {
      const taskId = data.taskId;
      if (!taskId) {
        addResult('video task id', false, 'missing taskId from video upload');
        continue;
      }
      let finalTask = null;
      for (let i = 0; i < 30; i += 1) {
        const statusResponse = await fetchJson(`${apiBaseUrl.replace(/\/+$/, '')}/uploads/status/${taskId}`);
        if (statusResponse.ok && statusResponse.data?.status && statusResponse.data.status !== 'processing') {
          finalTask = statusResponse.data;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      addResult('video processing completed', Boolean(finalTask && finalTask.status === 'completed'), finalTask ? finalTask.status : 'timeout');
      const targetUrl = finalTask?.targetUrl || data.targetUrl || '';
      const objectName = normalizeObjectNameFromResponse(finalTask || data, targetUrl);
      if (!objectName) {
        addResult('track video object', false, 'missing object name from final video result');
        continue;
      }
      trackedObjects.push({ bucketName, objectName, fileName: file.name });
      addResult('track video object', true, objectName);
      if (targetUrl) {
        addResult('video target url reachable', (await fetchText(targetUrl)).ok, targetUrl);
      }
    } else {
      const objectName = normalizeObjectNameFromResponse(data, data.url || '');
      if (!objectName) {
        addResult('track image object', false, 'missing object name from upload response');
        continue;
      }
      trackedObjects.push({ bucketName, objectName, fileName: file.name });
      addResult('track image object', true, objectName);
      addResult('image url reachable', (await fetchText(data.url)).ok, data.url || 'missing url');
    }
  }
}

function checkEnvCompleteness() {
  const missingRoot = ['VITE_API_BASE_URL'].filter((k) => !rootEnv[k]);
  const missingServer = ['PORT', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'MINIO_ENABLED', 'MINIO_ENDPOINT', 'MINIO_PORT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY'].filter((k) => !serverEnv[k]);
  addResult('.env root variables', missingRoot.length === 0, missingRoot.length ? `missing: ${missingRoot.join(', ')}` : 'ok');
  addResult('server/.env variables', missingServer.length === 0, missingServer.length ? `missing: ${missingServer.join(', ')}` : 'ok');
  if (serverEnv.MINIO_ENABLED === 'true') {
    const missingMinio = ['MINIO_PUBLIC_BASE_URL', 'PUBLIC_FILE_BASE_URL'].filter((k) => !serverEnv[k]);
    addResult('MinIO public URL config', missingMinio.length === 0, missingMinio.length ? `missing: ${missingMinio.join(', ')}` : 'ok');
  }
}

function checkStartupOrder() {
  const startAllText = exists('scripts/start-all.ps1') ? readText('scripts/start-all.ps1') : '';
  const startMinioText = exists('scripts/start-minio.ps1') ? readText('scripts/start-minio.ps1') : '';
  const toolsText = exists('scripts/portfolio-tools.ps1') ? readText('scripts/portfolio-tools.ps1') : '';
  addResult('start-all loads shared settings', startAllText.includes('portfolio-tools.settings.json'), 'uses shared settings file');
  addResult('start-minio uses shared settings', startMinioText.includes('portfolio-tools.settings.json'), 'uses shared settings file');
  addResult('GUI has Start MinIO action', toolsText.includes('Start-MinIO') || toolsText.includes('startMinio'), 'button wired');
}

function checkUploadFlow() {
  const serverText = [
    'server/src/routes/upload.routes.js',
    'server/src/controllers/upload.controller.js',
    'server/src/routes/media.routes.js',
    'server/src/controllers/media.controller.js',
  ].filter(exists).map(readText).join('\n');
  addResult('upload-related backend modules present', Boolean(serverText), serverText ? 'ok' : 'missing backend modules');
  addResult('backend mentions MinIO upload path', /uploadFile\(|presignedGetObject|MINIO_PUBLIC_BASE_URL|MINIO_UPLOAD_PREFIX/.test(serverText), 'storage flow detected');
}

function checkMinioReceipt() {
  const ok = serverEnv.MINIO_ENABLED === 'true' && Boolean(serverEnv.MINIO_ENDPOINT && serverEnv.MINIO_PORT && serverEnv.MINIO_ACCESS_KEY && serverEnv.MINIO_SECRET_KEY);
  addResult('MinIO connection info complete', ok, ok ? 'ok' : 'missing endpoint/port/keys');
  addResult('MinIO expected to receive uploads', ok && Boolean(serverEnv.MINIO_PUBLIC_BASE_URL || serverEnv.PUBLIC_FILE_BASE_URL), 'public URL set');
}

async function checkHomepageRender() {
  const base = rootEnv.VITE_FRONTEND_URL || `http://localhost:${rootEnv.VITE_FRONTEND_PORT || 5175}`;
  const homepage = await fetchText(base);
  addResult('frontend homepage reachable', homepage.ok, `HTTP ${homepage.status}`);
  if (homepage.ok) {
    const html = homepage.text;
    addResult('homepage contains root mount', html.includes('id="root"') || html.includes('id=\'root\''), 'root element present');
    addResult('homepage includes Vite entry', /src\/main\.(jsx|js)|@vite/i.test(html), 'entry script detected');
    addResult('homepage has title tag', /<title>.*<\/title>/is.test(html), 'title present');
    if (openPage) {
      const opener = process.platform === 'win32'
        ? spawnSync('cmd', ['/c', 'start', '', base], { windowsHide: true, shell: false })
        : spawnSync('xdg-open', [base], { windowsHide: true, shell: false });
      addResult('homepage opened in browser', opener.status === 0, opener.status === 0 ? 'opened' : opener.error?.message || 'open failed', 'optional');
    }
  }
}

function runProcessChecks() {
  const nodeCheck = run('node', ['-v']);
  addResult('Node available', nodeCheck.ok, nodeCheck.stdout.trim() || nodeCheck.error || 'node check failed');
  const npmCheck = run('npm', ['-v']);
  addResult('npm available', npmCheck.ok, npmCheck.stdout.trim() || npmCheck.error || 'npm check failed');
}

checkEnvCompleteness();
checkStartupOrder();
checkUploadFlow();
checkMinioReceipt();
runProcessChecks();
await checkHomepageRender();
await runUploadTests();
if (!keepTestFiles) {
  const cleanupResults = await deleteTrackedObjects();
  addResult('cleanup test objects', cleanupResults.every((item) => item.startsWith('deleted ')), cleanupResults.join('; '));
}

const requiredFailures = results.filter((item) => item.severity === 'required' && !item.pass);
const passed = results.filter((item) => item.pass).length;
const failed = results.length - passed;
const summary = { ok: requiredFailures.length === 0, passed, failed, total: results.length, results, trackedObjects };
const reportPaths = writeReports(summary);
summary.reportPaths = reportPaths;

if (jsonOutput) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log('=== ENV HEALTH CHECK ===');
  for (const item of results) {
    console.log(`[${item.pass ? 'PASS' : 'FAIL'}] ${item.name}${item.detail ? ` (${item.detail})` : ''}`);
  }
  console.log('------------------------');
  console.log(`Result: ${passed}/${results.length} passed, ${failed} failed`);
  console.log(`Report written to: ${reportPaths.mdPath}`);
}

if (requiredFailures.length > 0) process.exit(1);
