# ContentFlow · AI 内容批量生产 MVP

> 给线下商家 / 中小品牌做 AI 社交内容量产的工作台。
> 人设档案 → 批量生成 → 审阅通过 → 扣费对账，一条链路闭环。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 可选：配置真实 LLM（不配也能跑，会用 canned 占位文案）
cp .env.example .env
# OPENAI_API_KEY=sk-xxx

# 3. 启动
npm run dev
# 打开 http://localhost:3000
```

生产部署：

```bash
npm run build
npm run start
```

## MVP 范围

优先打通「人设 → 批量生成 → 审阅 → 扣费」主链路。分发、素材库、团队管理下一版本补齐。

| 模块 | 说明 |
|------|------|
| 人设档案 | 品牌调性、卖点、禁用词、受众画像 —— AI 的唯一知识源 |
| 批量生成 | 一个批次可混排图文笔记 / 短视频脚本 / 口播文案，并发生成 |
| 审阅台 | 三栏工作区：左侧批次 · 中间内容 · 右侧操作（通过 / 驳回 / 重生成） |
| 额度扣费 | 月度额度 + 加购额度，先冻结后实扣，每条账单可追溯 |
| 账单流水 | 每笔生成 / 退还自动记录，按批次关联 |

### 暂未实现（Q2）

全平台分发、素材库、团队成员与权限、Stripe 真实付费、Prisma/Postgres 持久化。

## 技术栈

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **OpenAI SDK**（默认 gpt-4o-mini，key 未配时自动 fallback）
- JSON 文件持久化（`./.data/store.json`），无需外部数据库

## 目录

```
src/
├── app/
│   ├── page.tsx               Dashboard
│   ├── profiles/page.tsx      人设档案管理
│   ├── batches/page.tsx       批次列表 + 创建
│   ├── workbench/page.tsx     三栏审阅台
│   ├── billing/page.tsx       订阅 + 额度 + 账单
│   └── api/                   REST API（8 条路由）
├── components/                AppShell · ToastProvider
└── lib/
    ├── types.ts               全部类型定义
    ├── store.ts               JSON-backed store（并发锁 + 状态机 + 额度事务）
    └── llm.ts                 OpenAI provider + fallback
```

## 额度规则

- 每条内容 = **2 额度**（生成）+ **5 额度**（封面）= 7 额度
- 扣费流程：**freeze → commit / refund**，余额永不复负
- 优先级：月度额度用完后自动扣加购余额
- 批次结束剩余冻结额自动退还

## API 一览

| Method | Path | 说明 |
|--------|------|------|
| GET/POST | `/api/profiles` | 人设列表 / 创建 |
| GET/POST | `/api/batches` | 批次列表 / 创建（创建后异步生成） |
| GET | `/api/batches/[id]` | 批次详情 + 条目 |
| POST | `/api/batches/[id]/cancel` | 取消批次 |
| POST | `/api/items/[id]/review` | 审阅条目（approve / reject） |
| POST | `/api/items/[id]/regenerate` | 单条重生成 |
| GET | `/api/credits` | 当前额度 |
| GET | `/api/bills` | 账单流水 |

## License

TBD
