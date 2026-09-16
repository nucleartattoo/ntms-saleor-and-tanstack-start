# Nuclear Tattoo Supply (NTMS) - Saleor & TanStack Start

Nuclear Tattoo Supply (NTMS) professional e-commerce platform monorepo, featuring Saleor 3.23 GraphQL API backend and an Apple Store-styled TanStack Start (Router/Query/Form) storefront.

## 架构概览 (Architecture)

```
.
├── apps/
│   ├── storefront/        # TanStack Start / Router / Query / Form + Tailwind CSS v4 前端
│   └── saleor-core/       # Saleor 3.23 Django + GraphQL Python 电商核心
├── docker/
│   └── manage-containers.sh # macOS Apple Container 原生容器生命周期管理
├── scripts/
│   ├── sync_remote_db.sh  # 远程 PostgreSQL 数据同步脚本
│   ├── sync_media.sh      # 商品图片媒体同步脚本
│   ├── ensure_auth_credentials.py # 管理员账号就绪验证
│   └── ...
├── dev.sh                 # 一键本地全栈开发启动脚本
└── .gitignore
```

## 端口分配与环境规范 (Port & Services Matrix)

本地运行采用 Apple 原生 **Apple Container** 引擎，与本地已有其他 Saleor 项目严格物理隔离：

| 服务 | 容器/进程 | 本地端口 | 说明 |
| :--- | :--- | :--- | :--- |
| **Storefront** | Node.js (TanStack Start) | `3002` | 前台商城，Apple Store 极简浅色规范 |
| **Saleor Core API**| Python 3.12 (uv) | `8003` | Django / GraphQL 端点 (`/graphql/`) |
| **Saleor Dashboard**| `ntms-dashboard` | `9002` | 管理后台 Web 端 |
| **PostgreSQL** | `ntms-postgres` | `5434` | Saleor 3.23 数据库 |
| **Redis** | `ntms-redis` | `6381` | 缓存与 Celery Broker |

## 快速启动 (Quick Start)

### 1. 启动本地全栈开发环境

```bash
./dev.sh
```

`dev.sh` 会自动按顺序：
1. 检测并清理 `3002` 和 `8003` 残留孤儿进程
2. 通过 Apple Container 拉起 `ntms-postgres` (5434)、`ntms-redis` (6381)、`ntms-dashboard` (9002)
3. 启动 `saleor-core` API 服务 (`http://localhost:8003/graphql/`)
4. 启动 `storefront` 开发服务器 (`http://localhost:3002/`)

### 2. 独立前端开发

```bash
cd apps/storefront
npm install
npm run dev -- --port 3002
```

- 代码检查与测试：`npm run verify`
- 单元测试：`npm test`
- Cloudflare Pages 构建验证：`npm run build:cf`

### 3. 多渠道商业支持 (Multi-Channel)

- **Default Channel** (`default-channel`): 美国市场 (USD)，支持全品类设备、针耗材、色料与配件。
- **Canada Channel** (`canada`): 加拿大独立市场 (CAD)，独立 Mississauga 仓储、加元结算与 13% HST 税率，并由专属区域团队权限隔离。
