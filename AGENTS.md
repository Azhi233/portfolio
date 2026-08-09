# AGENTS.md

This file provides guidance to Lingma (lingma.aliyun.com) when working with code in this repository.

## 项目概览

个人作品集网站:React 19 SPA 前端 + Express 后端(`server/`),展示摄影/视频作品,并提供管理控制台(`/console`)在线编辑站点内容。所有站点内容(文案、项目、媒体、评价)以 JSON 快照形式存储在 MySQL `global_config` 表;媒体文件存 MinIO(公共 bucket 直链,私有 bucket 预签名 URL)。界面中英双语。部署目标为宝塔服务器(GitHub Actions),另有 Vercel SPA 配置。

## 常用命令

- `npm run dev` — 同时启动 Vite 前端与 Express 后端(`concurrently`);`npm run dev:frontend` 仅前端,`npm run dev --prefix server` 仅后端
- `npm run build` / `npm run lint` — 构建 / ESLint
- `npm run preflight` / `npm run preflight:quick` — 发布前检查(构建 + SEO/i18n/路由/鉴权回归断言,29 项)
- `npm run healthcheck` — 环境健康检查(`scripts/env-health-check.mjs`)
- `npm run sync:i18n` — 列出 `src/i18n/zh.js` 中 `en.js` 缺失的翻译键
- 无测试框架
- Windows 本地启动:`scripts/start-all.ps1`(前端+后端+MinIO)、`scripts/stop-all.ps1`;MinIO 也可用 `server/docker-compose.minio.yml`
- 环境变量:根 `.env`(`VITE_API_BASE_URL`、`VITE_BACKEND_PORT` — Vite 代理 `/api` 的目标端口);`server/.env`(`PORT`、`JWT_SECRET`、`CORS_ORIGIN`、`DB_*`(支持 `BAOTA_*`/`MYSQL_*` 前缀别名)、`MINIO_*`)。新增前端环境变量必须以 `VITE_` 开头

## 架构

### 配置驱动的前端状态(`src/context/`)

- 站点内容统一由 `ConfigContext`(`configStore.js`)管理:state + actions + syncService 三个工厂组合而成,未使用 Redux/React Query
- `configSync.js` 每 15 秒并行轮询 `/api/config`、`/api/projects`、`/api/reviews`、`/api/review-audit-logs`、`/api/project-unlocks`、`/api/delivery-unlocks`,经 `configNormalizers.js` 规范化后写入 React state 与 localStorage 快照(keys 见 `configStorage.js`)
- 编辑保存走 `persistConfigSnapshot`:将整个配置快照 POST `/api/config`(JWT 认证),随后通过 `BroadcastChannel` + `CustomEvent` 广播 `portfolio-config-updated`,实现多标签页/多窗口即时同步
- 页面展示组件直接消费 context 中的 config/projects/assets,不各自拉接口

### 后端(`server/`)

- Express 工厂模式:每个资源一对 `createXxxController()` + `createXxxRouter()`,在 `src/app.js` 中统一装配;`pool`、`JWT_SECRET`、`sseClients` 等依赖通过闭包注入
- MySQL(`mysql2/promise` pool):`src/db.js` 的 `initDB()` 负责建表(`global_config`、`projects`、`users`、`media_assets`、`reviews`、`review_audit_logs`、`project_unlocks`、`delivery_unlocks`、`video_transcode_tasks`);仓储层在 `src/db/`(repository),业务逻辑在 `src/services/`
- 容错设计:MySQL 或 MinIO 不可达时服务器**仍以降级模式启动**(有界重试 + 警告日志),页面核心功能依赖前端 localStorage 快照;`better-sqlite3` 在依赖中但代码未引用(`server/portfolio.db*` 为遗留文件)
- 认证:双凭证写鉴权(`src/middlewares/auth.middleware.js`)——admin JWT(`/api/login`,`ALLOW_REGISTER` 默认关闭注册)或 client token(`unlocks` 口令换取的 `private-<id>-<ts>-<sig>` HMAC 签名凭证,7 天有效);读接口经 `optionalAuth` 按鉴权状态脱敏(未鉴权不返回 `accessPassword`/`deliveryPin`/`privateFiles`);`JWT_SECRET` 生产环境缺失或为默认值时拒绝启动;admin 种子账号密码不再内置源码,由 `ADMIN_INIT_PASSWORD` 提供或随机生成打印一次
- 客户端访问控制:`unlocks` 相关表记录 project/delivery 解锁状态

### 媒体上传与视频转码(核心链路)

1. 上传走 `POST /api/uploads`(`multer` 磁盘存储,限制 20GB),图片与已转码 mp4 直接上传 MinIO(`public-assets` 公共读/`private-docs` 私有+预签名)并写入 `media_assets`;私有桶不设公共读策略
2. 非 mp4 视频(mov 等):立即返回 `202 + taskId` 并创建 `video_transcode_tasks` 记录;后台 `spawn ffmpeg` 转码为 H.264 mp4 后上传 MinIO,期间通过 SSE(`/api/events`)推送 `task-started/completed/failed` 事件
3. 前端 `src/services/ossUpload.js` 通过 SSE + 轮询 `/api/uploads/status/:taskId` 等待完成;SSE 广播负载不携带 URL 字段
4. 私有文件使用 MinIO 预签名 URL(默认 30 天);`src/utils/signedMedia.js` + `src/components/AutoRefreshMedia.jsx` 会在过期前自动调用 `POST /api/uploads/sign`(挂写鉴权)刷新 URL;项目详情的 `privateFiles` 在响应时实时重签(媒体渲染组件应优先使用 `AutoRefreshMedia`)

### 路由与 i18n

- `src/App.jsx` 为全部 SPA 路由(公开页 + `/console`);`/projects` 重定向到 `/videos`。所有内容页均由配置驱动,新增页面主要工作是消费 config 数据
- i18n:`src/i18n/zh.js` 与 `en.js` 为两个扁平的 JS 对象(locale 合并入口 `messages.js`);`registry.js` 管理 localStorage 语言与"评审模式"开关;新增文案必须同时维护两个文件(用 `npm run sync:i18n` 核对)
- 控制台页面在 `src/pages/console/`,管理面板/编辑器组件在 `src/components/`(如 `ProjectEditorModal`、`SortableSection` 等),均为配置驱动编辑

### 部署

- GitHub Actions(`.github/workflows/deploy.yml`):push main → `npm ci` + `npm run build` → SCP `dist/` 与 `server/`(排除 `.env`、`node_modules`、`uploads`)到宝塔服务器 → `npm ci --omit=dev` + `NODE_ENV=production` pm2 启动(服务器 Node v20.20.2);CI 使用 Node 22
- `vercel.json` 提供 SPA rewrites(备选部署方式)

## 注意事项

- 前后端均为 ESM(`"type": "module"`),使用相对路径导入
- ESLint 对 `^[A-Z_]` 开头的未使用变量放行(组件大写命名习惯)
- `scripts/*.log`、`server-backend.log` 为运行时日志,可忽略
- `CORS_ORIGIN` 需包含所有本地开发端口(5173–5178、4173 等),新增端口时同步更新 `server/.env`
- 服务器启动端口解析:`VITE_BACKEND_PORT || PORT`,默认 8789;Vite 代理默认指向 8788,本地两端口的配置需保持一致
