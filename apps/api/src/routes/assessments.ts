import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { runFullAssessment } from '@waps/engine'
import { renderReport } from '@waps/report'
import { runAllAgents } from '@waps/agent'
import type { AssessmentProject } from '@waps/schemas'
import {
  saveProject, loadProject, loadResult, saveResult,
  listProjects, saveReport, loadReport,
  updateProject, deleteProject,
} from '../storage/store.js'

export const assessmentsRouter = Router()

function buildProject(body: Partial<AssessmentProject>, id?: string): AssessmentProject {
  const now = new Date().toISOString()
  return {
    id: id ?? uuidv4(),
    projectName: body.projectName!,
    clientName: body.clientName,
    createdAt: body.createdAt ?? now,
    updatedAt: now,
    vessel: body.vessel!,
    route: body.route!,
    fuel: body.fuel!,
    weather: body.weather,
    deck: body.deck!,
    stability: body.stability,
    operation: body.operation!,
    policy: body.policy!,
    assumptions: body.assumptions,
  }
}

function validateSections(body: Partial<AssessmentProject>): string | null {
  if (!body.projectName) return 'projectName is required'
  if (!body.vessel || !body.route || !body.fuel || !body.deck || !body.operation || !body.policy)
    return 'Missing required sections: vessel, route, fuel, deck, operation, policy'
  return null
}

// ── POST /api/assessments ── Create project ──────────────────────────────────
assessmentsRouter.post('/', async (req: Request, res: Response) => {
  const err = validateSections(req.body)
  if (err) return res.status(400).json({ error: err })

  const project = buildProject(req.body)
  await saveProject(project)

  return res.status(201).json({
    assessmentId: project.id,
    projectName: project.projectName,
    status: 'draft',
    createdAt: project.createdAt,
  })
})

// ── GET /api/assessments ── List projects ────────────────────────────────────
assessmentsRouter.get('/', async (_req: Request, res: Response) => {
  const projects = await listProjects()
  return res.json(projects.map(p => ({
    assessmentId: p.project.id,
    projectName: p.project.projectName,
    clientName: p.project.clientName,
    vesselName: (p.project.vessel as Record<string, unknown>).vesselName,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  })))
})

// ── GET /api/assessments/:id ── Get project ──────────────────────────────────
assessmentsRouter.get('/:id', async (req: Request, res: Response) => {
  const stored = await loadProject(req.params.id)
  if (!stored) return res.status(404).json({ error: 'Assessment not found' })
  return res.json(stored)
})

// ── PUT /api/assessments/:id ── Update project data ──────────────────────────
assessmentsRouter.put('/:id', async (req: Request, res: Response) => {
  const stored = await loadProject(req.params.id)
  if (!stored) return res.status(404).json({ error: 'Assessment not found' })

  const err = validateSections(req.body)
  if (err) return res.status(400).json({ error: err })

  const project = buildProject(req.body, req.params.id)
  project.createdAt = stored.createdAt
  await updateProject(project)

  return res.json({ assessmentId: project.id, updatedAt: project.updatedAt })
})

// ── DELETE /api/assessments/:id ── Delete project ────────────────────────────
assessmentsRouter.delete('/:id', async (req: Request, res: Response) => {
  const stored = await loadProject(req.params.id)
  if (!stored) return res.status(404).json({ error: 'Assessment not found' })
  await deleteProject(req.params.id)
  return res.json({ deleted: true })
})

// ── POST /api/assessments/:id/run ── Run assessment ──────────────────────────
assessmentsRouter.post('/:id/run', async (req: Request, res: Response) => {
  const stored = await loadProject(req.params.id)
  if (!stored) return res.status(404).json({ error: 'Assessment not found' })

  try {
    const result = runFullAssessment(stored.project)
    await saveResult(result)

    return res.json({
      assessmentId: result.projectId,
      status: 'completed',
      totalScore: result.totalScore,
      rating: result.rating,
      recommendation: result.recommendation,
      recommendedWapsType: result.recommendedWapsType,
      fuelSavingBase: result.fuelSaving.baseFuelSavingT,
      co2ReductionBase: result.co2Reduction.baseCo2ReductionT,
      paybackBase: result.economics.paybackYearsBase,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: 'Assessment failed', details: message })
  }
})

// ── POST /api/assessments/:id/run-with-agents ── SSE streaming agent run ──────
assessmentsRouter.post('/:id/run-with-agents', async (req: Request, res: Response) => {
  const stored = await loadProject(req.params.id)
  if (!stored) return res.status(404).json({ error: 'Assessment not found' })

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(400).json({
      error: 'DEEPSEEK_API_KEY is not configured. Use POST /run for deterministic-only assessment.',
    })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  function send(event: string, data: unknown) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    send('start', { message: '开始确定性评估引擎…' })
    const result = runFullAssessment(stored.project)
    send('engine_done', { totalScore: result.totalScore, rating: result.rating })

    const agentSummaries = await runAllAgents(stored.project, result, {
      onProgress: (agentName, index, total) => {
        send('agent_progress', { agentName, index, total })
      },
    })

    result.agentSummaries = agentSummaries
    await saveResult(result)

    send('done', {
      assessmentId: result.projectId,
      totalScore: result.totalScore,
      rating: result.rating,
      recommendation: result.recommendation,
      agentSummaryCount: agentSummaries.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    send('error', { message })
  } finally {
    res.end()
  }
})

// ── GET /api/assessments/:id/results ── Get full results ─────────────────────
assessmentsRouter.get('/:id/results', async (req: Request, res: Response) => {
  const result = await loadResult(req.params.id)
  if (!result) {
    return res.status(404).json({
      error: 'Results not found. Run POST /api/assessments/:id/run first.',
    })
  }
  return res.json(result)
})

// ── POST /api/assessments/:id/report ── Generate Markdown report ─────────────
assessmentsRouter.post('/:id/report', async (req: Request, res: Response) => {
  const stored = await loadProject(req.params.id)
  if (!stored) return res.status(404).json({ error: 'Assessment not found' })

  const result = await loadResult(req.params.id)
  if (!result) {
    return res.status(400).json({
      error: 'No results found. Run POST /api/assessments/:id/run first.',
    })
  }

  const markdown = renderReport(stored.project, result)
  await saveReport(req.params.id, markdown)

  return res.json({ assessmentId: req.params.id, reportMarkdown: markdown })
})

// ── GET /api/assessments/:id/report ── Get existing report ───────────────────
assessmentsRouter.get('/:id/report', async (req: Request, res: Response) => {
  const markdown = await loadReport(req.params.id)
  if (!markdown) {
    return res.status(404).json({
      error: 'Report not found. Run POST /api/assessments/:id/report first.',
    })
  }

  const format = req.query.format as string
  if (format === 'raw') {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    return res.send(markdown)
  }
  return res.json({ assessmentId: req.params.id, reportMarkdown: markdown })
})
