const BASE = '/api'

export interface ProjectSummary {
  assessmentId: string
  projectName: string
  clientName?: string
  vesselName?: string
  status: 'draft' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface CreateProjectPayload {
  projectName: string
  clientName?: string
  vessel: Record<string, unknown>
  route: Record<string, unknown>
  fuel: Record<string, unknown>
  weather?: Record<string, unknown>
  deck: Record<string, unknown>
  stability?: Record<string, unknown>
  operation: Record<string, unknown>
  policy: Record<string, unknown>
}

export interface RunResult {
  assessmentId: string
  status: string
  totalScore: number
  rating: 'A' | 'B' | 'C' | 'D' | 'E'
  recommendation: string
  recommendedWapsType: string
  fuelSavingBase: number
  co2ReductionBase: number
  paybackBase: number | null
}

export interface FullResult {
  projectId: string
  totalScore: number
  rating: 'A' | 'B' | 'C' | 'D' | 'E'
  recommendation: string
  recommendedWapsType: string
  alternativeWapsTypes: string[]
  scores: Record<string, number>
  fuelSaving: { conservativeRate: number; baseRate: number; optimisticRate: number; conservativeFuelSavingT: number; baseFuelSavingT: number; optimisticFuelSavingT: number }
  co2Reduction: { conservativeCo2ReductionT: number; baseCo2ReductionT: number; optimisticCo2ReductionT: number }
  economics: { capexLowUsd: number; capexBaseUsd: number; capexHighUsd: number; annualOpexUsd: number; annualFuelCostSavingBaseUsd: number; paybackYearsConservative: number | null; paybackYearsBase: number | null; paybackYearsOptimistic: number | null; economicScore: number }
  vesselSuitability: { score: number; level: string; positiveFactors: string[]; constraints: string[]; redFlags: string[] }
  routeWind: { score: number; averageTrueWindSpeedMs?: number; favorableWindPercentage?: number; effectiveWindUtilizationRatio: number; routeRecommendation: string }
  policyCompliance: { score: number; applicablePolicies: string[] }
  shippingOperation: { score: number; impactLevel: string; majorConflicts: string[] }
  classRisk: { score: number; approvalComplexity: string; keyClassConcerns: string[] }
  stabilityStructure: { score: number; stabilityRiskLevel: string; missingCriticalData: string[] }
  dataCompleteness: { score: number; level: string; criticalMissingFields: string[] }
  risks: Array<{ id: string; category: string; severity: string; description: string; mitigation: string }>
  nextActions: Array<{ priority: string; action: string; responsible: string }>
  agentSummaries: Array<{ agentName: string; summary: string; keyFindings: string[]; recommendations: string[] }>
  generatedAt: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data as T
}

export interface StoredProject {
  project: {
    id: string
    projectName: string
    clientName?: string
    vessel: Record<string, unknown>
    route: Record<string, unknown>
    fuel: Record<string, unknown>
    weather?: Record<string, unknown>
    deck: Record<string, unknown>
    stability?: Record<string, unknown>
    operation: Record<string, unknown>
    policy: Record<string, unknown>
  }
  status: 'draft' | 'completed'
  createdAt: string
  updatedAt: string
}

export const api = {
  listProjects: () => request<ProjectSummary[]>('/assessments'),
  getProject: (id: string) => request<StoredProject>(`/assessments/${id}`),
  createProject: (payload: CreateProjectPayload) =>
    request<{ assessmentId: string; status: string }>('/assessments', { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (id: string, payload: CreateProjectPayload) =>
    request<{ assessmentId: string; updatedAt: string }>(`/assessments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProject: (id: string) =>
    request<{ deleted: boolean }>(`/assessments/${id}`, { method: 'DELETE' }),
  runAssessment: (id: string) =>
    request<RunResult>(`/assessments/${id}/run`, { method: 'POST' }),
  getResults: (id: string) =>
    request<FullResult>(`/assessments/${id}/results`),
  generateReport: (id: string) =>
    request<{ reportMarkdown: string }>(`/assessments/${id}/report`, { method: 'POST' }),
  getReport: (id: string) =>
    request<{ reportMarkdown: string }>(`/assessments/${id}/report`),
}
