# WAPS 船舶风能辅助改造适配评估系统

Wind-Assisted Propulsion System (WAPS) feasibility assessment platform for ship retrofit projects.

## Features

- 11 deterministic scoring dimensions (route, vessel, cargo, port, regulation, etc.)
- 10 DeepSeek AI agents for qualitative commentary per dimension
- Real-time SSE progress streaming during analysis
- Full Markdown report generation
- Project CRUD with draft / completed workflow
- Search and filter on project list

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, react-router-dom v6 |
| Backend | Express 4, TypeScript 5, tsx |
| AI | DeepSeek Chat (`openai` SDK, DeepSeek-compatible endpoint) |
| Storage | Redis (falls back to JSON files when `REDIS_URL` unset) |
| Monorepo | pnpm workspaces |

## Project Structure

```
waps-assessment/
├── apps/
│   ├── api/          # Express REST API + SSE streaming
│   └── web/          # React SPA (Vite)
└── packages/
    ├── schemas/      # Zod schemas shared across packages
    ├── engine/       # 11 scoring engines (deterministic)
    ├── report/       # Markdown report generator
    └── agent/        # DeepSeek AI agents (10 specialist + 1 synthesis)
```

## Quick Start (Development)

### Prerequisites

- Node.js 20+
- pnpm 9+
- DeepSeek API key (for AI agent analysis; optional for deterministic scoring only)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env and set DEEPSEEK_API_KEY=sk-...

# 3. Start API server (terminal 1)
pnpm dev:api

# 4. Start frontend dev server (terminal 2)
pnpm dev:web

# 5. Open browser
open http://localhost:5173
```

## Production Deployment

The API server serves the built React app as static files.

```bash
# 1. Set environment variables
export DEEPSEEK_API_KEY=sk-...
export REDIS_URL=redis://localhost:6379   # optional

# 2. Build frontend
pnpm build:web

# 3. Start production server (serves both API and frontend)
pnpm start

# 4. Open browser
open http://localhost:3001
```

### Custom Port

```bash
PORT=8080 pnpm start
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/assessments` | List all projects |
| POST | `/api/assessments` | Create new project |
| GET | `/api/assessments/:id` | Get project details |
| PUT | `/api/assessments/:id` | Update project |
| DELETE | `/api/assessments/:id` | Delete project |
| POST | `/api/assessments/:id/run` | Run deterministic scoring |
| POST | `/api/assessments/:id/run-with-agents` | Run scoring + AI agents (SSE) |
| GET | `/api/assessments/:id/results` | Get scoring results |
| GET | `/api/assessments/:id/report` | Get generated report |
| POST | `/api/assessments/:id/report` | Generate Markdown report |
| GET | `/health` | Health check |

## Rating Scale

| Grade | Score | Recommendation |
|-------|-------|----------------|
| A | 85–100 | 强烈推荐 |
| B | 70–84 | 建议推进 |
| C | 55–69 | 有条件推进 |
| D | 40–54 | 仅供研究 |
| E | 0–39 | 不建议 |

## Data Storage

Storage backend is selected at runtime:

| Condition | Backend |
|-----------|---------|
| `REDIS_URL` set | Redis (keys prefixed `waps:`) |
| `REDIS_URL` unset | JSON files under `apps/api/data/assessments/` |

Redis key layout:
```
waps:project:<id>    # Input data (JSON)
waps:result:<id>     # Scoring results (JSON)
waps:report:<id>     # Generated Markdown report
waps:projects        # Sorted set of all project IDs (by creation time)
```

## Disclaimer

仅供参考，不构成正式工程建议。All outputs are for reference only and do not constitute formal engineering advice.
