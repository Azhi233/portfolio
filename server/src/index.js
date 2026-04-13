import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenApi from '@alicloud/openapi-client';
import Sts20150401 from '@alicloud/sts20150401';
import {
  deleteProjectById,
  findProjectById,
  insertProject,
  readConfigObject,
  readProjects,
  updateProject,
  upsertConfigObject,
} from './db.js';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

const {
  OSS_BUCKET,
  OSS_REGION = 'oss-cn-shanghai',
  OSS_DIR_PREFIX = 'portfolio',
  OSS_POLICY_EXPIRE_SECONDS = '120',
  OSS_STS_DURATION_SECONDS = '900',
  OSS_STS_ACCESS_KEY_ID,
  OSS_STS_ACCESS_KEY_SECRET,
  OSS_STS_ROLE_ARN,
  OSS_STS_ROLE_SESSION_NAME = 'portfolio-web-upload',
  PORT = '8787',
} = process.env;

function assertEnv() {
  const missing = [];

  if (!OSS_BUCKET) missing.push('OSS_BUCKET');
  if (!OSS_REGION) missing.push('OSS_REGION');
  if (!OSS_STS_ACCESS_KEY_ID) missing.push('OSS_STS_ACCESS_KEY_ID');
  if (!OSS_STS_ACCESS_KEY_SECRET) missing.push('OSS_STS_ACCESS_KEY_SECRET');
  if (!OSS_STS_ROLE_ARN) missing.push('OSS_STS_ROLE_ARN');

  if (missing.length > 0) {
    throw new Error(`Missing required env: ${missing.join(', ')}`);
  }
}

function safeExt(fileName = '') {
  const parts = String(fileName).split('.');
  if (parts.length < 2) return 'bin';
  return parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
}

function safeDir(inputDir = '') {
  const cleaned = String(inputDir)
    .replace(/\\/g, '/')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  if (!cleaned) return OSS_DIR_PREFIX;
  return `${OSS_DIR_PREFIX}/${cleaned}`;
}

function toBase64(input) {
  return Buffer.from(input).toString('base64');
}

function signPolicy(policyBase64, accessKeySecret) {
  return crypto.createHmac('sha1', accessKeySecret).update(policyBase64).digest('base64');
}

async function createStsClient() {
  const config = new OpenApi.Config({
    accessKeyId: OSS_STS_ACCESS_KEY_ID,
    accessKeySecret: OSS_STS_ACCESS_KEY_SECRET,
    endpoint: 'sts.cn-hangzhou.aliyuncs.com',
  });
  return new Sts20150401(config);
}

async function assumeUploadRole({ objectKey, contentType }) {
  const stsClient = await createStsClient();

  const bucketArn = `acs:oss:*:*:${OSS_BUCKET}`;
  const objectArn = `acs:oss:*:*:${OSS_BUCKET}/${objectKey}`;

  const inlinePolicy = {
    Version: '1',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['oss:PutObject', 'oss:AbortMultipartUpload'],
        Resource: [bucketArn, objectArn],
        Condition: contentType
          ? {
              StringEquals: {
                'oss:ContentType': contentType,
              },
            }
          : {},
      },
    ],
  };

  const request = new Sts20150401.AssumeRoleRequest({
    roleArn: OSS_STS_ROLE_ARN,
    roleSessionName: OSS_STS_ROLE_SESSION_NAME,
    durationSeconds: Math.max(900, Number(OSS_STS_DURATION_SECONDS) || 900),
    policy: JSON.stringify(inlinePolicy),
  });

  const response = await stsClient.assumeRole(request);
  const credentials = response?.body?.credentials;

  if (!credentials) {
    throw new Error('STS credentials not returned');
  }

  return {
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    securityToken: credentials.securityToken,
    expiration: credentials.expiration,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'oss-policy-api-sts' });
});

app.get('/api/config', (_req, res) => {
  const config = readConfigObject();
  res.json({ ok: true, data: config });
});

app.post('/api/config', (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ ok: false, message: 'Config payload must be a JSON object.' });
  }

  const data = upsertConfigObject(payload);
  return res.json({ ok: true, data });
});

app.get('/api/projects', (_req, res) => {
  const data = readProjects();
  res.json({ ok: true, data });
});

app.post('/api/projects', (req, res) => {
  const project = req.body || {};

  if (!project.id || !project.title) {
    return res.status(400).json({ ok: false, message: 'Project id and title are required.' });
  }

  insertProject(project);
  const created = findProjectById(project.id);
  return res.status(201).json({ ok: true, data: created });
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const existed = findProjectById(id);

  if (!existed) {
    return res.status(404).json({ ok: false, message: 'Project not found.' });
  }

  const merged = {
    ...existed,
    ...(req.body || {}),
    id,
  };

  if (!merged.title) {
    return res.status(400).json({ ok: false, message: 'Project title is required.' });
  }

  updateProject(id, merged);
  const updated = findProjectById(id);
  return res.json({ ok: true, data: updated });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const deleted = deleteProjectById(id);

  if (!deleted) {
    return res.status(404).json({ ok: false, message: 'Project not found.' });
  }

  return res.json({ ok: true, data: { id } });
});

app.post('/api/oss/policy', async (req, res, next) => {
  try {
    assertEnv();

    const { fileName = '', contentType = '', dir = 'uploads' } = req.body || {};
    if (!fileName) return res.status(400).json({ message: 'fileName is required' });

    const ext = safeExt(fileName);
    const folder = safeDir(dir);
    const objectKey = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

    const sts = await assumeUploadRole({ objectKey, contentType });

    const now = Date.now();
    const policyExpireSeconds = Math.max(30, Number(OSS_POLICY_EXPIRE_SECONDS) || 120);
    const expireAt = now + policyExpireSeconds * 1000;

    const policyObj = {
      expiration: new Date(expireAt).toISOString(),
      conditions: [
        ['content-length-range', 0, 1024 * 1024 * 1024],
        { bucket: OSS_BUCKET },
        ['eq', '$key', objectKey],
        ['eq', '$x-oss-security-token', sts.securityToken],
        ...(contentType ? [['eq', '$Content-Type', contentType]] : []),
      ],
    };

    const policy = toBase64(JSON.stringify(policyObj));
    const signature = signPolicy(policy, sts.accessKeySecret);

    const host = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com`;
    const url = `${host}/${objectKey}`;

    return res.json({
      accessKeyId: sts.accessKeyId,
      securityToken: sts.securityToken,
      securityTokenExpireAt: sts.expiration,
      policy,
      signature,
      host,
      key: objectKey,
      dir: folder,
      expireAt,
      url,
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);

  const detail = error?.message || 'unknown_error';
  if (detail.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ ok: false, message: 'Record already exists.', detail });
  }

  return res.status(500).json({
    ok: false,
    message: 'internal_server_error',
    detail,
  });
});

app.listen(Number(PORT), () => {
  console.log(`OSS STS policy API running at http://localhost:${PORT}`);
});
