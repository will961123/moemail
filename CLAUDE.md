# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MoeMail 是一个基于 Next.js + Cloudflare 技术栈构建的临时邮箱服务。项目采用 App Router 架构，使用 Cloudflare Pages 部署，D1 作为数据库，Email Workers 处理邮件接收。

## 核心技术栈

- **前端框架**: Next.js 15 (App Router)
- **部署平台**: Cloudflare Pages
- **数据库**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **认证**: NextAuth 5.0 (支持 GitHub 和 Google OAuth)
- **国际化**: next-intl (支持中英文)
- **样式**: Tailwind CSS + Radix UI
- **邮件解析**: postal-mime
- **包管理器**: pnpm

## 常用开发命令

### 本地开发
```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 代码检查
pnpm lint
```

### 数据库操作
```bash
# 本地数据库迁移
pnpm db:migrate-local

# 远程数据库迁移
pnpm db:migrate-remote

# 生成测试数据（邮箱和邮件）
pnpm generate-test-data
```

### Workers 开发和测试
```bash
# 部署邮件接收 Worker（本地无法测试，需部署后测试）
pnpm deploy:email

# 本地运行清理 Worker
pnpm dev:cleanup

# 测试清理 Worker
pnpm test:cleanup
```

### Webhook 测试
```bash
# 启动 Webhook 测试服务器（监听 3001 端口）
pnpm webhook-test-server

# 使用 Cloudflare Tunnel 暴露到外网
pnpx cloudflared tunnel --url http://localhost:3001
```

### 部署
```bash
# 一键部署脚本（推荐）
pnpm dlx tsx ./scripts/deploy/index.ts

# 单独部署 Pages
pnpm deploy:pages

# 单独部署邮件 Worker
pnpm deploy:email

# 单独部署清理 Worker
pnpm deploy:cleanup
```

## 项目架构

### 目录结构

```
app/
├── [locale]/              # 国际化路由
│   ├── page.tsx          # 首页
│   ├── login/            # 登录页
│   ├── moe/              # 邮箱管理页
│   ├── profile/          # 个人中心
│   └── shared/           # 分享页面
├── api/                  # API 路由
│   ├── auth/            # 认证相关
│   ├── emails/          # 邮箱管理
│   ├── config/          # 系统配置
│   ├── roles/           # 角色权限
│   └── webhook/         # Webhook 配置
├── components/          # React 组件
│   ├── auth/           # 认证组件
│   ├── emails/         # 邮箱相关组件
│   ├── profile/        # 个人中心组件
│   ├── ui/             # UI 基础组件
│   └── theme/          # 主题组件
└── lib/                # 工具库
    ├── schema.ts       # 数据库 Schema
    ├── db.ts           # 数据库连接
    ├── auth.ts         # 认证配置
    ├── permissions.ts  # 权限系统
    └── webhook.ts      # Webhook 逻辑

workers/
├── email-receiver.ts   # 邮件接收 Worker
└── cleanup.ts          # 定时清理 Worker

scripts/
├── deploy/             # 部署脚本
└── migrate.ts          # 数据库迁移脚本
```

### 数据库 Schema

核心表结构（定义在 `app/lib/schema.ts`）：

- **users**: 用户表，存储用户基本信息
- **accounts**: OAuth 账号关联表
- **emails**: 临时邮箱表，包含地址、过期时间等
- **messages**: 邮件消息表，存储收发的邮件内容
- **webhooks**: Webhook 配置表
- **roles**: 角色表（皇帝、公爵、骑士、平民）
- **userRoles**: 用户角色关联表
- **apiKeys**: API 密钥表
- **emailShares**: 邮箱分享链接表
- **messageShares**: 邮件分享链接表

重要索引：
- `email_address_lower_idx`: 邮箱地址小写索引，用于不区分大小写查询
- `message_email_id_received_at_type_idx`: 复合索引，优化邮件列表查询

### 权限系统

基于角色的权限控制（RBAC），四个角色等级：

1. **皇帝 (Emperor)**: 网站所有者，拥有所有权限
2. **公爵 (Duke)**: 可使用临时邮箱、配置 Webhook、管理 API Key
3. **骑士 (Knight)**: 可使用临时邮箱、配置 Webhook
4. **平民 (Civilian)**: 无权限

权限检查逻辑在 `app/lib/permissions.ts` 中实现。

### 邮件处理流程

1. **接收邮件**: Cloudflare Email Routing → `workers/email-receiver.ts`
2. **解析邮件**: 使用 `postal-mime` 解析原始邮件
3. **存储邮件**: 查找目标邮箱（不区分大小写），插入 messages 表
4. **Webhook 通知**: 如果用户配置了 Webhook，发送 POST 请求通知

### 清理机制

`workers/cleanup.ts` 通过 Cron Trigger 定时执行：
- 删除过期的临时邮箱
- 级联删除关联的邮件消息（通过外键约束）
- 批量处理，每次最多 100 条

### API 认证

支持两种认证方式：
1. **Session 认证**: NextAuth session，用于 Web 界面
2. **API Key 认证**: 通过 `X-API-Key` 请求头，用于 OpenAPI

API Key 验证逻辑在 `app/lib/apiKey.ts` 中实现。

## 配置文件

### Wrangler 配置

项目使用三个 Wrangler 配置文件：

- `wrangler.json`: Pages 项目配置
- `wrangler.email.json`: 邮件接收 Worker 配置
- `wrangler.cleanup.json`: 清理 Worker 配置

首次使用需要从 `.example.json` 文件复制并配置数据库 ID。

### 环境变量

必需的环境变量（在 `.env` 文件中配置）：

- `CLOUDFLARE_API_TOKEN`: Cloudflare API 令牌
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账户 ID
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`: GitHub OAuth
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`: Google OAuth
- `AUTH_SECRET`: NextAuth 加密密钥
- `DATABASE_NAME`: D1 数据库名称
- `KV_NAMESPACE_NAME`: KV 命名空间名称

可选环境变量：
- `CUSTOM_DOMAIN`: 自定义域名
- `PROJECT_NAME`: Pages 项目名（默认 moemail）

## 部署流程

自动化部署脚本 `scripts/deploy/index.ts` 执行以下步骤：

1. 验证环境变量
2. 设置 Wrangler 配置文件
3. 检查/创建 D1 数据库
4. 执行数据库迁移
5. 检查/创建 KV 命名空间
6. 检查/创建 Pages 项目
7. 推送环境变量到 Pages
8. 部署 Pages 应用
9. 部署 Email Worker
10. 部署 Cleanup Worker

## 国际化

使用 `next-intl` 实现多语言支持：
- 语言文件位于 `messages/` 目录
- 支持中文（zh）和英文（en）
- 路由格式：`/[locale]/...`

## 开发注意事项

1. **邮件 Worker 测试**: 本地无法测试邮件接收功能，必须部署到 Cloudflare 后配置 Email Routing 才能测试
2. **数据库迁移**: 修改 Schema 后需要运行迁移命令
3. **API 路由**: 所有 API 路由都在 `app/api/` 目录下，使用 Next.js Route Handlers
4. **权限检查**: 修改权限相关功能时，确保更新 `app/lib/permissions.ts`
5. **Webhook 超时**: Webhook 请求应在 10 秒内响应，否则会触发重试
