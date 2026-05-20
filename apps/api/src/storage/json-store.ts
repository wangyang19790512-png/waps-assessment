import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import type { AssessmentProject, AssessmentResult } from '@waps/schemas'

// Resolve to project root regardless of CWD (works from apps/api or root)
import { fileURLToPath } from 'url'
import { dirname } from 'path'
const _dir = dirname(fileURLToPath(import.meta.url))
const APP_DIR = join(_dir, '..', '..')   // src/storage → src → apps/api
const DATA_DIR = join(APP_DIR, 'data', 'assessments')

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

function projectPath(id: string) {
  return join(DATA_DIR, `${id}.json`)
}

function resultPath(id: string) {
  return join(DATA_DIR, `${id}.result.json`)
}

function reportPath(id: string) {
  return join(DATA_DIR, `${id}.report.md`)
}

export interface StoredProject {
  project: AssessmentProject
  status: 'draft' | 'completed'
  createdAt: string
  updatedAt: string
}

// ── Projects ────────────────────────────────────────────────────────────────

export function saveProject(project: AssessmentProject): void {
  ensureDir()
  const stored: StoredProject = {
    project,
    status: 'draft',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
  writeFileSync(projectPath(project.id), JSON.stringify(stored, null, 2), 'utf-8')
}

export function loadProject(id: string): StoredProject | null {
  const p = projectPath(id)
  if (!existsSync(p)) return null
  return JSON.parse(readFileSync(p, 'utf-8')) as StoredProject
}

export function updateProjectStatus(id: string, status: StoredProject['status']): void {
  const stored = loadProject(id)
  if (!stored) return
  stored.status = status
  stored.updatedAt = new Date().toISOString()
  writeFileSync(projectPath(id), JSON.stringify(stored, null, 2), 'utf-8')
}

export function updateProject(project: AssessmentProject): void {
  const stored = loadProject(project.id)
  if (!stored) return
  stored.project = project
  stored.status = 'draft'
  stored.updatedAt = new Date().toISOString()
  writeFileSync(projectPath(project.id), JSON.stringify(stored, null, 2), 'utf-8')
}

export function deleteProject(id: string): void {
  for (const p of [projectPath(id), resultPath(id), reportPath(id)]) {
    if (existsSync(p)) unlinkSync(p)
  }
}

export function listProjects(): StoredProject[] {
  ensureDir()
  return readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !f.endsWith('.result.json'))
    .map(f => {
      try {
        return JSON.parse(readFileSync(join(DATA_DIR, f), 'utf-8')) as StoredProject
      } catch {
        return null
      }
    })
    .filter((p): p is StoredProject => p !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

// ── Results ──────────────────────────────────────────────────────────────────

export function saveResult(result: AssessmentResult): void {
  ensureDir()
  writeFileSync(resultPath(result.projectId), JSON.stringify(result, null, 2), 'utf-8')
  updateProjectStatus(result.projectId, 'completed')
}

export function loadResult(id: string): AssessmentResult | null {
  const p = resultPath(id)
  if (!existsSync(p)) return null
  return JSON.parse(readFileSync(p, 'utf-8')) as AssessmentResult
}

// ── Reports ──────────────────────────────────────────────────────────────────

export function saveReport(id: string, markdown: string): string {
  ensureDir()
  const p = reportPath(id)
  writeFileSync(p, markdown, 'utf-8')
  return p
}

export function loadReport(id: string): string | null {
  const p = reportPath(id)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf-8')
}
