import Redis from 'ioredis'
import type { AssessmentProject, AssessmentResult } from '@waps/schemas'
import type { StoredProject } from './json-store.js'

let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.REDIS_URL!
    _redis = new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 3 })
  }
  return _redis
}

const KEY = {
  project: (id: string) => `waps:project:${id}`,
  result:  (id: string) => `waps:result:${id}`,
  report:  (id: string) => `waps:report:${id}`,
  index:   () => 'waps:projects',
}

// ── Projects ────────────────────────────────────────────────────────────────

export async function saveProjectRedis(project: AssessmentProject): Promise<void> {
  const r = getRedis()
  const stored: StoredProject = {
    project,
    status: 'draft',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
  await r.set(KEY.project(project.id), JSON.stringify(stored))
  await r.zadd(KEY.index(), Date.now(), project.id)
}

export async function loadProjectRedis(id: string): Promise<StoredProject | null> {
  const raw = await getRedis().get(KEY.project(id))
  if (!raw) return null
  return JSON.parse(raw) as StoredProject
}

export async function updateProjectRedis(project: AssessmentProject): Promise<void> {
  const stored = await loadProjectRedis(project.id)
  if (!stored) return
  stored.project = project
  stored.status = 'draft'
  stored.updatedAt = new Date().toISOString()
  await getRedis().set(KEY.project(project.id), JSON.stringify(stored))
}

export async function updateProjectStatusRedis(id: string, status: StoredProject['status']): Promise<void> {
  const stored = await loadProjectRedis(id)
  if (!stored) return
  stored.status = status
  stored.updatedAt = new Date().toISOString()
  await getRedis().set(KEY.project(id), JSON.stringify(stored))
}

export async function deleteProjectRedis(id: string): Promise<void> {
  const r = getRedis()
  await r.del(KEY.project(id), KEY.result(id), KEY.report(id))
  await r.zrem(KEY.index(), id)
}

export async function listProjectsRedis(): Promise<StoredProject[]> {
  const r = getRedis()
  const ids = await r.zrevrange(KEY.index(), 0, -1)
  const results: StoredProject[] = []
  for (const id of ids) {
    const raw = await r.get(KEY.project(id))
    if (raw) results.push(JSON.parse(raw) as StoredProject)
  }
  return results
}

// ── Results ──────────────────────────────────────────────────────────────────

export async function saveResultRedis(result: AssessmentResult): Promise<void> {
  await getRedis().set(KEY.result(result.projectId), JSON.stringify(result))
  await updateProjectStatusRedis(result.projectId, 'completed')
}

export async function loadResultRedis(id: string): Promise<AssessmentResult | null> {
  const raw = await getRedis().get(KEY.result(id))
  if (!raw) return null
  return JSON.parse(raw) as AssessmentResult
}

// ── Reports ──────────────────────────────────────────────────────────────────

export async function saveReportRedis(id: string, markdown: string): Promise<void> {
  await getRedis().set(KEY.report(id), markdown)
}

export async function loadReportRedis(id: string): Promise<string | null> {
  return getRedis().get(KEY.report(id))
}
