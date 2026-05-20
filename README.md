# WAPS 船舶风能辅助改造适配评估系统

Wind-Assisted Propulsion System (WAPS) feasibility assessment platform for ship retrofit projects.

## Features

- 11 deterministic scoring dimensions (route, vessel, cargo, port, regulation, etc.)
- 10 Claude Haiku AI agents for qualitative commentary per dimension
- Real-time SSE progress streaming during analysis
- Full Markdown report generation
- Project CRUD with draft / completed workflow
- Search and filter on project list

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, react-router-dom v6 |
| Backend | Express 4, TypeScript 5, tsx |
| AI | Anthropic Claude Haiku (`@anthropic-ai/sdk`) |
| Storage | JSON files (`apps/api/data/assessments/`) |
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
    └── agent/        # Claude Haiku AI agents
```

## Quick Start (Development)

### Prerequisites

- Node.js 20+
- pnpm 9+
- Anthropic API key

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...

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
# 1. Set environment variable
export ANTHROPIC_API_KEY=sk-ant-...

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

Assessment data is persisted as JSON files under `apps/api/data/assessments/`:

```
data/assessments/
├── project-<uuid>.json   # Input data
├── result-<uuid>.json    # Scoring results
└── report-<uuid>.json    # Generated reports
```

## Disclaimer

仅供参考，不构成正式工程建议。All outputs are for reference only and do not constitute formal engineering advice.
