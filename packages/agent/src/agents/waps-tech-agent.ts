import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { getClient, AGENT_MODEL } from '../client.js'

export async function runWapsTechAgent(
  project: AssessmentProject,
  result: AssessmentResult,
): Promise<AgentSummary> {
  const client = getClient()

  const wm = result.wapsMatching
  const context = {
    recommendedType: wm.recommendedType,
    alternativeTypes: wm.alternativeTypes,
    notRecommendedTypes: wm.notRecommendedTypes,
    reasoning: wm.reasoning,
    technologyRisks: wm.technologyRisks,
    nextValidationTasks: wm.nextValidationTasks,
    vesselType: project.vessel.vesselType,
    loaM: project.vessel.loaM,
    availableDeckAreaM2: project.deck.availableDeckAreaM2,
  }

  const msg = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 700,
    system: `You are a WAPS technology specialist with expertise in rotor sails, suction wings, rigid wing sails, soft sails, and kite systems.
Your task: interpret WAPS technology matching results and provide expert commentary in Chinese.
Output JSON only: { "summary": string, "keyFindings": string[], "recommendations": string[] }
- summary: 2-3 sentences on the recommended WAPS technology and why in Chinese
- keyFindings: 3-5 specific findings about technology selection in Chinese
- recommendations: 3-4 technology validation next steps in Chinese
Do NOT invent numbers. Only interpret the provided matching results.`,
    messages: [
      {
        role: 'user',
        content: `WAPS技术路线匹配结果：\n${JSON.stringify(context, null, 2)}\n\n请用中文分析并以JSON格式输出。`,
      },
    ],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const parsed = extractJson(raw)

  return {
    agentName: 'WAPS技术路线分析',
    summary: parsed.summary ?? 'WAPS技术路线分析完成。',
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
