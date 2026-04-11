import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenApi from '@alicloud/openapi-client';
import Sts20150401 from '@alicloud/sts20150401';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

/**
 * ================================
 * 阿里云 OSS + STS 环境变量说明
 * ================================
 * 必填（在阿里云后台获取）：
 *
 * 1) OSS_BUCKET
 *    - OSS Bucket 名称
 *
 * 2) OSS_REGION
 *    - Bucket 所在地域（如 oss-cn-shanghai）
 *
 * 3) OSS_STS_ACCESS_KEY_ID
 *    - 用于调用 STS AssumeRole 的 RAM 用户 AK
 *    - 该 RAM 用户需要有 sts:AssumeRole 权限
 *
 * 4) OSS_STS_ACCESS_KEY_SECRET
 *    - 上述 RAM 用户的 SK
 *
 * 5) OSS_STS_ROLE_ARN
 *    - 要被扮演的 RAM 角色 ARN
 *    - 该角色应授予 OSS 上传所需最小权限
 *
 * 可选：
 * 6) OSS_STS_ROLE_SESSION_NAME
 *    - STS 会话名，默认 portfolio-web-upload
 *
 * 7) OSS_DIR_PREFIX
 *    - 上传目录前缀，默认 portfolio
 *
 * 8) OSS_POLICY_EXPIRE_SECONDS
 *    - 前端 policy 过期时间，默认 120 秒
 *
 * 9) OSS_STS_DURATION_SECONDS
 *    - STS token 有效期（秒），默认 900 秒
 *
 * 10) PORT
 *    - 服务端口，默认 8787
 */
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

/**
 * 仅签发 STS + Policy 给前端，文件流不经过服务器。
 */
app.post('/api/oss/policy', async (req, res) => {
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
    return res.status(500).json({
      message: 'failed_to_generate_sts_policy',
      detail: error?.message || 'unknown_error',
    });
  }
});

app.listen(Number(PORT), () => {
  console.log(`OSS STS policy API running at http://localhost:${PORT}`);
});
