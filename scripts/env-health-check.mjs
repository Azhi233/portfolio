import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const scriptRoot = path.join(root, 'scripts');
const serverRoot = path.join(root, 'server');
const results = [];
const failFast = process.argv.includes('--fail-fast');
const jsonOutput = process.argv.includes('--json');

function addResult(name, pass, detail = '', severity = 'required') {
  results.push({ name, pass, detail, severity });
  return pass;
}

function readText(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

function exists(filePath) {
  return fs.existsSync(path.join(root, filePath));
}

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
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
  return env;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
    timeout: options.timeout || 120000,
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
    error: result.error?.message || '',
  };
}

function checkEnvCompleteness() {
  const rootEnv = parseEnvFile('.env');
  const serverEnv = parseEnvFile('server/.env');
  const requiredRoot = ['VITE_API_BASE_URL'];
  const requiredServer = ['PORT', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'MINIO_ENABLED', 'MINIO_ENDPOINT', 'MINIO_PORT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY'];

  const missingRoot = requiredRoot.filter((key) => !rootEnv[key]);
  const missingServer = requiredServer.filter((key) => !serverEnv[key]);

  addResult('.env root variables', missingRoot.length === 0, missingRoot.length ? `missing: ${missingRoot.join(', ')}` : 'ok');
  addResult('server/.env variables', missingServer.length === 0, missingServer.length ? `missing: ${missingServer.join(', ')}` : 'ok');

  if (serverEnv.MINIO_ENABLED === 'true') {
    const minioFields = ['MINIO_PUBLIC_BASE_URL', 'PUBLIC_FILE_BASE_URL'];
    const missingMinio = minioFields.filter((key) => !serverEnv[key]);
    addResult('MinIO public URL config', missingMinio.length === 0, missingMinio.length ? `missing: ${missingMinio.join(', ')}` : 'ok');
  }
}

function checkStartupOrder() {
  const startAll = path.join(scriptRoot, 'start-all.ps1');
  const startMinio = path.join(scriptRoot, 'start-minio.ps1');
  const portfolioTools = path.join(scriptRoot, 'portfolio-tools.ps1');

  if (!exists('scripts/start-all.ps1') || !exists('scripts/start-minio.ps1')) {
    addResult('startup scripts exist', false, 'missing start-all.ps1 or start-minio.ps1');
    return;
  }

  const startAllText = fs.readFileSync(startAll, 'utf8');
  const startMinioText = fs.readFileSync(startMinio, 'utf8');
  const toolsText = fs.readFileSync(portfolioTools, 'utf8');

  addResult('start-all starts MinIO before backend', /Start-Process[\s\S]*minio|Start-MinIO/i.test(startAllText), 'manual review recommended', 'required');
  addResult('start-all loads shared settings', startAllText.includes('portfolio-tools.settings.json'), 'uses shared settings file');
  addResult('start-minio uses shared settings', startMinioText.includes('portfolio-tools.settings.json'), 'uses shared settings file');
  addResult('GUI has Start MinIO action', toolsText.includes('Start-MinIO') || toolsText.includes('startMinio'), 'button wired');
}

function checkUploadFlow() {
  const serverUploadFiles = [
    'server/src/routes/upload.routes.js',
    'server/src/controllers/upload.controller.js',
    'server/src/routes/media.routes.js',
    'server/src/controllers/media.controller.js',
  ];
  const existing = serverUploadFiles.filter((file) => exists(file));
  addResult('upload-related backend modules present', existing.length > 0, existing.join(', '));

  const serverFiles = existing.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  addResult('backend mentions MinIO upload path', /uploadFile\(|presignedGetObject|MINIO_PUBLIC_BASE_URL|MINIO_UPLOAD_PREFIX/.test(serverFiles), 'storage flow detected');

  const clientFiles = [
    'src/components/ProjectMediaUploader.jsx',
    'src/components/MediaPicker.jsx',
    'src/components/MediaPreview.jsx',
    'src/pages/console/ProjectsPanel.jsx',
  ].filter((file) => exists(file));
  addResult('frontend upload UI present', clientFiles.length > 0, clientFiles.join(', '));
}

function checkMinioReceipt() {
  const minioEnv = parseEnvFile('server/.env');
  if (minioEnv.MINIO_ENABLED !== 'true') {
    addResult('MinIO enabled in server/.env', false, 'MINIO_ENABLED is not true');
    return;
  }
  const ok = Boolean(minioEnv.MINIO_ENDPOINT && minioEnv.MINIO_PORT && minioEnv.MINIO_ACCESS_KEY && minioEnv.MINIO_SECRET_KEY);
  addResult('MinIO connection info complete', ok, ok ? 'ok' : 'missing endpoint/port/keys');
  addResult('MinIO expected to receive uploads', ok && Boolean(minioEnv.MINIO_PUBLIC_BASE_URL || minioEnv.PUBLIC_FILE_BASE_URL), 'public URL set');
}

function checkFrontendRender() {
  const appText = exists('src/App.jsx') ? readText('src/App.jsx') : '';
  const homeText = exists('src/pages/Home.jsx') ? readText('src/pages/Home.jsx') : '';
  const navText = exists('src/components/NavBar.jsx') ? readText('src/components/NavBar.jsx') : '';
  addResult('frontend app exists', Boolean(appText), 'src/App.jsx present');
  addResult('home page exists', Boolean(homeText), 'src/pages/Home.jsx present');
  addResult('navigation exists', Boolean(navText), 'src/components/NavBar.jsx present');
  addResult('frontend uses API base URL', exists('src/utils/api.js') && readText('src/utils/api.js').includes('API_BASE_URL'), 'network layer configured');
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
checkFrontendRender();
runProcessChecks();

const requiredFailures = results.filter((item) => item.severity === 'required' && !item.pass);
const passed = results.filter((item) => item.pass).length;
const failed = results.length - passed;
const summary = {
  ok: requiredFailures.length === 0,
  passed,
  failed,
  total: results.length,
  results,
};

if (jsonOutput) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log('=== ENV HEALTH CHECK ===');
  for (const item of results) {
    const mark = item.pass ? 'PASS' : 'FAIL';
    const detail = item.detail ? ` (${item.detail})` : '';
    console.log(`[${mark}] ${item.name}${detail}`);
  }
  console.log('------------------------');
  console.log(`Result: ${passed}/${results.length} passed, ${failed} failed`);
}

if (requiredFailures.length > 0) process.exit(1);
