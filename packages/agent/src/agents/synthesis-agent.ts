import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { getClient, AGENT_MODEL } from '../client.js'

export async function runSynthesisAgent(
  project: AssessmentProject,
  result: AssessmentResult,
  previousSummaries: AgentSummary[],
): Promise<AgentSummary> {
  const client = getClient()

  const context = {
    projectName: project.projectName,
    vesselName: project.vessel.vesselName,
    totalScore: result.totalScore,
    rating: result.rating,
    recommendation: result.recommendation,
    recommendedWapsType: result.recommendedWapsType,
    alternativeWapsTypes: result.alternativeWapsTypes,
    scores: result.scores,
    risks: result.risks.map(r => ({ id: r.id, severity: r.severity, description: r.description })),
    nextActions: result.nextActions,
    agentFindings: previousSummaries.map(s => ({
      agent: s.agentName,
      topFindings: s.keyFindings.slice(0, 2),
    })),
  }

  const msg = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 800,
    system: `You are a senior WAPS project advisor synthesizing the results of a comprehensive feasibility assessment.
Your task: produce a concise executive synthesis in Chinese, integrating all specialist analyses.
Output JSON only: { "summary": string, "keyFindings": string[], "recommendations": string[] }
- summary: 3-4 sentences executive conclusion in Chinese (include score, rating, recommendation)
- keyFindings: 4-6 cross-cutting findings from all dimensions in Chinese
- recommendations: 4-5 prioritized next steps for the shipowner in Chinese
Do NOT invent data. Only synthesize what has been computed and analyzed.`,
    messages: [
      {
        role: 'user',
        content: `综合评估结果（供管理层摘要）：\n${JSON.stringify(context, null, 2)}\n\n请用中文综合分析并以JSON格式输出。`,
      },
    ],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const parsed = extractJson(raw)

  return {
    agentName: '综合评估报告',
    summary: parsed.summary ?? '综合评估分析完成。',
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
