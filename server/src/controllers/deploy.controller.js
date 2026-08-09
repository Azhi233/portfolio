import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

function readSecret() {
  return String(process.env.GITHUB_WEBHOOK_SECRET || process.env.DEPLOY_WEBHOOK_SECRET || '').trim();
}

function timingSafeEqual(a = '', b = '') {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifySignature(rawBody, signatureHeader) {
  const secret = readSecret();
  if (!secret) return false;
  const header = String(signatureHeader || '').trim();
  if (!header.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEqual(header.slice(7), expected);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, shell: false });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      const error = new Error(`${command} ${args.join(' ')} exited with code ${code}${stderr ? `: ${stderr.slice(-2000)}` : ''}`);
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function resolveRepoPath() {
  return process.env.DEPLOY_REPO_PATH || path.resolve(process.cwd(), '..');
}

function parseWebhookBody(rawBody = '') {
  try {
    return JSON.parse(String(rawBody || '{}'));
  } catch {
    return {};
  }
}

function resolveBuildCommand(repoPath) {
  const frontendBuild = process.env.DEPLOY_FRONTEND_BUILD || 'npm run build';
  const serverBuild = process.env.DEPLOY_SERVER_BUILD || 'npm run build --prefix server';
  return { repoPath, frontendBuild, serverBuild };
}

function getShellArgs(commandLine) {
  return process.platform === 'win32' ? ['/c', commandLine] : ['-lc', commandLine];
}

function resolveRestartCommands() {
  const services = String(process.env.DEPLOY_RESTART_SERVICES || 'portfolio,portfolio-web').split(',').map((item) => item.trim()).filter(Boolean);
  const extra = String(process.env.DEPLOY_RESTART_EXTRA || '').split(';').map((item) => item.trim()).filter(Boolean);
  return { services, extra };
}

async function restartServices(services, extra = []) {
  const results = [];
  for (const service of services) {
    try {
      const output = await runCommand('systemctl', ['restart', service]);
      results.push({ service, ok: true, output: output.stdout.slice(-1000) });
    } catch (error) {
      results.push({ service, ok: false, error: error.message });
    }
  }
  if (services.length === 0) {
    try {
      const dockerPs = await runCommand('docker', ['ps', '--format', '{{.Names}}']);
      const names = dockerPs.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      for (const name of names.filter((name) => /portfolio|web/i.test(name))) {
        try {
          const restarted = await runCommand('docker', ['restart', name]);
          results.push({ container: name, ok: true, output: restarted.stdout.slice(-1000) });
        } catch (error) {
          results.push({ container: name, ok: false, error: error.message });
        }
      }
    } catch (error) {
      results.push({ dockerScan: true, ok: false, error: error.message });
    }
  }
  for (const commandLine of extra) {
    const [command, ...args] = commandLine.split(/\s+/).filter(Boolean);
    if (!command) continue;
    try {
      const output = await runCommand(command, args);
      results.push({ command: commandLine, ok: true, output: output.stdout.slice(-1000) });
    } catch (error) {
      results.push({ command: commandLine, ok: false, error: error.message });
    }
  }
  return results;
}

export function createDeployController() {
  let running = false;
  let lastResult = null;

  async function webhookHandler(req, res) {
    const rawBody = req.rawBody || '';
    if (!verifySignature(rawBody, req.get('x-hub-signature-256'))) {
      return res.status(401).json({ ok: false, message: 'Invalid webhook signature.' });
    }

    const event = String(req.get('x-github-event') || '').trim();
    if (event && event !== 'push') {
      return res.status(200).json({ ok: true, skipped: true, message: `Ignored ${event} event.` });
    }

    const payload = parseWebhookBody(rawBody);
    const branch = String(payload?.ref || '').split('/').pop();
    if (branch && branch !== 'main') {
      return res.status(200).json({ ok: true, skipped: true, message: `Ignored branch ${branch}.` });
    }

    if (running) {
      return res.status(202).json({ ok: true, running: true, message: 'Deployment already in progress.' });
    }

    running = true;
    const startedAt = new Date().toISOString();
    const repoPath = resolveRepoPath();
    const { frontendBuild, serverBuild } = resolveBuildCommand(repoPath);
    const { services, extra } = resolveRestartCommands();

    try {
      await ensureDir(repoPath);
      const pullResult = await runCommand('git', ['pull', '--ff-only', 'origin', 'main'], { cwd: repoPath });
      const frontendResult = await runCommand(process.platform === 'win32' ? 'cmd' : 'sh', getShellArgs(frontendBuild), { cwd: repoPath });
      const serverResult = await runCommand(process.platform === 'win32' ? 'cmd' : 'sh', getShellArgs(serverBuild), { cwd: repoPath });
      const restartResult = await restartServices(services, extra);
      lastResult = {
        ok: true,
        startedAt,
        repoPath,
        pull: pullResult.stdout.slice(-2000),
        frontendBuild: frontendResult.stdout.slice(-2000),
        serverBuild: serverResult.stdout.slice(-2000),
        restartResult,
        finishedAt: new Date().toISOString(),
      };
      return res.json({ ok: true, data: lastResult });
    } catch (error) {
      lastResult = {
        ok: false,
        startedAt,
        repoPath,
        error: error.message,
        finishedAt: new Date().toISOString(),
      };
      return res.status(500).json({ ok: false, message: error.message, data: lastResult });
    } finally {
      running = false;
    }
  }

  function statusHandler(_req, res) {
    return res.json({ ok: true, data: { running, lastResult } });
  }

  return { webhookHandler, statusHandler };
}
