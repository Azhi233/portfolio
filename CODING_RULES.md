# CODING_RULES.md

编码规范与安全红线,供在此仓库工作的 AI 助手与开发者参考。沉淀自 `refactor/enterprise-p0` 企业级安全重构(P0–P2 共 14 项修复)。

与 [AGENTS.md](AGENTS.md) 的分工:AGENTS.md 描述项目架构、常用命令与链路概览(what/where);本文档规定跨任务必须遵守的编码规范与安全红线(do/don't)。两份文档表述必须一致,发现矛盾时以实际代码为准并同步修正。

## 1. Git 提交规范

- **小步提交**:一次提交只聚焦一个修复批次,禁止把无关改动混入同一提交
- **提交信息格式**:`fix(scope): summary` / `refactor(scope): summary` / `ci: ...` / `docs: ...`,scope 如 `server`、`frontend`(例:`fix(server): gate registration, enforce JWT_SECRET and sign client tokens`)
- 提交信息正文用中文 bullet 列出本次要点,控制在 3–6 条
- 提交前必须通过 `npm run preflight`(CI 无独立 lint 环节,preflight 内含 build + `eslint server/src` + 鉴权回归断言)
- 删除文件用 `git rm` 或 `git add -A` 正确记录删除,不要留下空引用

## 2. 代码风格约定

- 前后端均为 ESM(`"type": "module"`),一律使用**相对路径**导入,禁止绝对路径/别名
- 后端工厂模式:每个资源一对 `createXxxController()` + `createXxxRouter()`,在 `src/app.js` 统一装配;`pool`、`JWT_SECRET`、`writeAuth`、`sseClients` 等依赖通过**闭包注入**,禁止模块级单例状态
- 分层:控制器只做参数校验与响应组装,业务逻辑放 `src/services/`,SQL 放 `src/db/`(repository)
- ESLint 约定(`eslint.config.js` 已配置,勿在代码里用 `void x` 之类绕过):
  - `no-unused-vars` 对 `^[A-Z_]` 开头的未使用变量放行(组件/工厂大写命名习惯)
  - 参数用 `^_` 前缀放行
  - **`ignoreRestSiblings: true`**:允许 `const { accessPassword, ...rest } = project;` 解构剥离字段——这是响应脱敏的推荐写法
- 前端为 React 19 函数组件,组件名大写;新增文案必须同步维护 `src/i18n/zh.js` 与 `en.js`(用 `npm run sync:i18n` 核对)

## 3. 鉴权规范(安全红线)

- **写接口必须挂 `writeAuth`**:除显式公开例外外,所有 POST/PUT/PATCH/DELETE 一律挂 `writeAuth` 中间件;公开例外必须在路由行加行尾注释说明(当前仅 `POST /client-access/unlock` 与 `POST /reviews`——后者为公开评论,`status` 由服务端强制 `pending`)
- **新增受保护写路由后,必须同步更新** `scripts/preflight-check.mjs` 的 `protectedWrites` 数组,否则 preflight 会失败
- **读接口按敏感度挂 `optionalAuth`**:返回私有字段(`accessPassword`/`deliveryPin`/`password`/`privateFiles`)的读接口必须挂 `optionalAuth` 并按 `req.authKind` 脱敏(未鉴权删除私有字段;`kind=private` 未鉴权返回空)
- **client token 必须走 HMAC 签名格式**:`private-<projectId>-<timestamp>-<signature>`,signature = HMAC-SHA256(`JWT_SECRET`, `client:<projectId>:<timestamp>`).hex 前 16 位,TTL 7 天;签发统一走 `createClientToken()`(见 `server/src/middlewares/auth.middleware.js`)。**禁止再引入任何明文口令类/自造格式凭证**
- **`JWT_SECRET` 严禁硬编码兜底**:生产环境(`NODE_ENV=production`)缺失或等于默认值(`portfolio-dev-secret`、`change-me-to-a-long-random-string`)时拒绝启动(`server/src/index.js` 的 `isInsecureJwtSecret`)
- **公开注册默认关闭**:`ALLOW_REGISTER=true` 才开放 `POST /api/register`,否则 403
- **admin 种子账号**:源码不内置密码;`initAdmin.js` 用 `ADMIN_INIT_PASSWORD` 或随机生成(打印一次),并检测 legacy 默认密码 `zhizhi233`
- 敏感字段剥离用 rest 解构(见第 2 节),不要修改原对象引用后再返回

## 4. 媒体存储与上传

- **私有桶不设公共读策略**:`private-docs` 桶禁止 `setBucketPolicy` 公共读(仅 `public-assets` 可公共读);私有文件一律预签名 URL:`getPresignedUrl(bucketName, objectName)`(参数必须显式传桶名)
- **上传必须用 multer 磁盘存储**(`mkdtemp` 临时目录 + `createReadStream` 流式上传 + `putObject` 透传 `size`),**禁止内存缓冲式大文件上传**(原 memoryStorage + 20GB 限制会 OOM);临时目录在请求结束或转码完成后清理
- **视频转码隐私字段必须透传**:`processVideoTask` 的 `privacy` 从请求读取,禁止硬编码 `isPrivate=false`
- **SSE 广播负载不得携带 `targetUrl`/`url` 字段**(匿名 SSE 连接不得获得文件地址),用解构剥离后广播
- **`GET /api/uploads/status/:taskId` 响应不得包含 `originalPath`**(内部字段,剥离后返回)
- 前端私有文件展示:预签名 URL 过期前由 `AutoRefreshMedia` 自动调 `POST /api/uploads/sign`(挂 writeAuth)刷新;新组件应优先复用 `AutoRefreshMedia`,不要自行拼 URL

## 5. 脚本与 CI 维护

- **`scripts/env-health-check.mjs`**:
  - 上传/清理测试需要 admin token:先 `POST /api/login` 获取(凭据 `HEALTHCHECK_ADMIN_USER`/`HEALTHCHECK_ADMIN_PASSWORD`,兜底 `ADMIN_INIT_USERNAME`/`ADMIN_INIT_PASSWORD`)
  - **无凭据时必须 SKIP 而非 FAIL**(`severity='optional'`,不阻塞退出码)
  - 默认端口 8789,读取顺序 `PORT` → `VITE_BACKEND_PORT` → 8789
- **`scripts/preflight-check.mjs`**:`protectedWrites` 数组必须与所有受保护写路由一致(当前 8 个路由文件);auth 中间件导出断言覆盖 `createAdminAuthMiddleware`/`createWriteAuthMiddleware`/`createOptionalAuthMiddleware`/`createClientToken` 四个工厂
- **`deploy.yml`**:pm2 启动必须显式 `NODE_ENV=production`(错误中间件据此不泄漏内部堆栈);CI 只跑 build,不跑 lint
- **healthcheck 清理接口**:`DELETE /api/healthcheck/minio-object` 仅接受 `portfolio/healthcheck` 前缀对象 + 白名单桶(`public-assets`/`private-docs`),新增测试桶时必须同步白名单

## 6. 环境变量说明

| 变量 | 缺省行为 | 作用 |
| --- | --- | --- |
| `ALLOW_REGISTER` | 未设/非 `true` 时注册返回 403 | 显式开放公开注册(不建议生产开启) |
| `JWT_SECRET` | 生产缺失或等于默认值时拒绝启动 | admin JWT 与 client token HMAC 签名密钥 |
| `ADMIN_INIT_USERNAME` | `zhizhi` | initAdmin 种子账号用户名 |
| `ADMIN_INIT_PASSWORD` | 缺省随机生成(base64url 12 字节)并打印一次 | initAdmin 种子账号密码;生产首次部署必须设置 |
| `HEALTHCHECK_ADMIN_USER` | `zhizhi` | env-health-check 登录用户名 |
| `HEALTHCHECK_ADMIN_PASSWORD` | 缺省时上传/清理测试 SKIP | env-health-check 登录密码 |
| `NODE_ENV` | 部署时显式 `production` | 生产强校验 JWT_SECRET、错误中间件堆栈策略 |
| `PORT` / `VITE_BACKEND_PORT` | 默认 8789 | 后端监听端口;本地两端口的配置需保持一致(Vite 代理指向 8788 的历史配置需一并核对) |
| `DB_*` | 支持 `BAOTA_*`/`MYSQL_*` 前缀别名 | MySQL 连接配置 |
| `MINIO_*` | — | MinIO 端点/密钥/桶配置 |

新增前端环境变量必须以 `VITE_` 开头;敏感变量(密钥、密码)只放 `server/.env`,禁止提交到仓库。
