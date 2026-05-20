import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { getClient, AGENT_MODEL } from '../client.js'

export async function runDataGapAgent(
  project: AssessmentProject,
  result: AssessmentResult,
): Promise<AgentSummary> {
  const client = getClient()

  const dc = result.dataCompleteness
  const context = {
    dataCompletenessScore: dc.score,
    level: dc.level,
    criticalMissingFields: dc.criticalMissingFields,
    optionalMissingFields: dc.optionalMissingFields,
    canGeneratePreliminaryReport: dc.canGeneratePreliminaryReport,
  }

  const msg = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 600,
    system: `You are a maritime data quality analyst specializing in WAPS (Wind-Assisted Propulsion System) feasibility assessments.
Your task: analyze the data completeness results and provide clear, actionable guidance in Chinese.
Output JSON only: { "summary": string, "keyFindings": string[], "recommendations": string[] }
- summary: 2-3 sentences overview in Chinese
- keyFindings: 3-5 specific findings about data quality in Chinese
- recommendations: 3-5 concrete data collection actions in Chinese
Do NOT invent numbers. Only interpret the data provided.`,
    messages: [
      {
        role: 'user',
        content: `数据完整性评估结果：\n${JSON.stringify(context, null, 2)}\n\n请用中文分析并以JSON格式输出。`,
      },
    ],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const parsed = extractJson(raw)

  return {
    agentName: '数据完整性分析',
    summary: parsed.summary ?? '数据完整性分析完成。',
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
