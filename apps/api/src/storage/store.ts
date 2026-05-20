/**
 * Unified async storage facade.
 * Uses Redis when REDIS_URL is set, falls back to JSON files.
 */
import type { AssessmentProject, AssessmentResult } from '@waps/schemas'
import type { StoredProject } from './json-store.js'
import {
  saveProject as fsSave, loadProject as fsLoad, updateProject as fsUpdate,
  updateProjectStatus as fsUpdateStatus, deleteProject as fsDelete,
  listProjects as fsList, saveResult as fsSaveResult, loadResult as fsLoadResult,
  saveReport as fsSaveReport, loadReport as fsLoadReport,
} from './json-store.js'
import {
  saveProjectRedis, loadProjectRedis, updateProjectRedis, updateProjectStatusRedis,
  deleteProjectRedis, listProjectsRedis, saveResultRedis, loadResultRedis,
  saveReportRedis, loadReportRedis,
} from './redis-store.js'

const useRedis = !!process.env.REDIS_URL

export async function saveProject(project: AssessmentProject): Promise<void> {
  if (useRedis) return saveProjectRedis(project)
  fsSave(project)
}

export async function loadProject(id: string): Promise<StoredProject | null> {
  if (useRedis) return loadProjectRedis(id)
  return fsLoad(id)
}

export async function updateProject(project: AssessmentProject): Promise<void> {
  if (useRedis) return updateProjectRedis(project)
  fsUpdate(project)
}

export async function updateProjectStatus(id: string, status: StoredProject['status']): Promise<void> {
  if (useRedis) return updateProjectStatusRedis(id, status)
  fsUpdateStatus(id, status)
}

export async function deleteProject(id: string): Promise<void> {
  if (useRedis) return deleteProjectRedis(id)
  fsDelete(id)
}

export async function listProjects(): Promise<StoredProject[]> {
  if (useRedis) return listProjectsRedis()
  return fsList()
}

export async function saveResult(result: AssessmentResult): Promise<void> {
  if (useRedis) return saveResultRedis(result)
  fsSaveResult(result)
}

export async function loadResult(id: string): Promise<AssessmentResult | null> {
  if (useRedis) return loadResultRedis(id)
  return fsLoadResult(id)
}

export async function saveReport(id: string, markdown: string): Promise<void> {
  if (useRedis) return saveReportRedis(id, markdown)
  fsSaveReport(id, markdown)
}

export async function loadReport(id: string): Promise<string | null> {
  if (useRedis) return loadReportRedis(id)
  return fsLoadReport(id)
}
