import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { getClient, AGENT_MODEL } from '../client.js'

export async function runVesselAgent(
  project: AssessmentProject,
  result: AssessmentResult,
): Promise<AgentSummary> {
  const client = getClient()

  const vs = result.vesselSuitability
  const v = project.vessel
  const context = {
    vesselType: v.vesselType,
    loaM: v.loaM,
    beamM: v.beamM,
    serviceSpeedKn: v.serviceSpeedKn,
    yearBuilt: v.yearBuilt,
    dwtT: v.dwtT,
    score: vs.score,
    level: vs.level,
    positiveFactors: vs.positiveFactors,
    constraints: vs.constraints,
    redFlags: vs.redFlags,
    requiresNavalArchitectReview: vs.requiresNavalArchitectReview,
  }

  const msg = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 600,
    system: `You are a naval architect specializing in WAPS retrofit feasibility assessments.
Your task: interpret vessel suitability scoring results and provide expert commentary in Chinese.
Output JSON only: { "summary": string, "keyFindings": string[], "recommendations": string[] }
- summary: 2-3 sentences on vessel suitability in Chinese
- keyFindings: 3-5 specific findings about this vessel in Chinese
- recommendations: 2-4 next steps for vessel assessment in Chinese
Do NOT invent numbers or facts. Only interpret the provided data.`,
    messages: [
      {
        role: 'user',
        content: `船型适配评估结果：\n${JSON.stringify(context, null, 2)}\n\n请用中文分析并以JSON格式输出。`,
      },
    ],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const parsed = extractJson(raw)

  return {
    agentName: '船型适配分析',
    summary: parsed.summary ?? '船型适配分析完成。',
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
