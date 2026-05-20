import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { getClient, AGENT_MODEL } from '../client.js'

export async function runStabilityAgent(
  project: AssessmentProject,
  result: AssessmentResult,
): Promise<AgentSummary> {
  const client = getClient()

  const ss = result.stabilityStructure
  const stab = project.stability
  const context = {
    stabilityScore: ss.score,
    stabilityRiskLevel: ss.stabilityRiskLevel,
    structureRiskLevel: ss.structureRiskLevel,
    requiresNavalArchitectReview: ss.requiresNavalArchitectReview,
    requiresDeckFoundationReview: ss.requiresDeckFoundationReview,
    keyRisks: ss.keyRisks,
    missingCriticalData: ss.missingCriticalData,
    gmM: stab?.gmM,
    maxAllowableAdditionalWeightT: stab?.maxAllowableAdditionalWeightT,
    deckLoadLimitTPerM2: stab?.deckLoadLimitTPerM2,
    stabilityBookletAvailable: stab?.stabilityBookletAvailable,
    structuralDrawingsAvailable: stab?.structuralDrawingsAvailable,
    incliningTestDataAvailable: stab?.incliningTestDataAvailable,
  }

  const msg = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 600,
    system: `You are a naval architect specializing in stability and structural assessment for WAPS retrofits.
Your task: interpret stability and structural screening results and provide safety commentary in Chinese.
Output JSON only: { "summary": string, "keyFindings": string[], "recommendations": string[] }
- summary: 2-3 sentences on stability and structural safety in Chinese
- keyFindings: 3-5 specific stability/structural findings in Chinese
- recommendations: 3-4 structural verification actions in Chinese
Do NOT invent stability numbers. Only interpret the provided data.`,
    messages: [
      {
        role: 'user',
        content: `稳性与结构初筛评估结果：\n${JSON.stringify(context, null, 2)}\n\n请用中文分析并以JSON格式输出。`,
      },
    ],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const parsed = extractJson(raw)

  return {
    agentName: '稳性与结构分析',
    summary: parsed.summary ?? '稳性与结构分析完成。',
    keyFindings: parsed.keyFindings ?? [],
    recommendations: parsed.recommendations ?? [],
  }
}

function extractJson(text: string): { summary?: string; keyFindings?: string[]; recommendations?: string[] } {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {
    // ignore
  }
  return {}
}
