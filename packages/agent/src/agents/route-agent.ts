import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { getClient, AGENT_MODEL } from '../client.js'

export async function runRouteAgent(
  project: AssessmentProject,
  result: AssessmentResult,
): Promise<AgentSummary> {
  const client = getClient()

  const rw = result.routeWind
  const r = project.route
  const w = project.weather
  const context = {
    routeName: r.routeName,
    routeDistanceNm: r.routeDistanceNm,
    seasonalPattern: r.seasonalPattern,
    score: rw.score,
    averageTrueWindSpeedMs: rw.averageTrueWindSpeedMs,
    favorableWindPercentage: rw.favorableWindPercentage,
    effectiveWindUtilizationRatio: rw.effectiveWindUtilizationRatio,
    seasonalVariability: rw.seasonalVariability,
    bestSeason: rw.bestSeason,
    worstSeason: rw.worstSeason,
    routeRecommendation: rw.routeRecommendation,
    seasonalVariabilityProfile: w?.seasonalVariability,
  }

  const msg = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 600,
    system: `You are a maritime meteorologist specializing in wind resource assessment for WAPS projects.
Your task: interpret route wind resource results and provide expert commentary in Chinese.
Output JSON only: { "summary": string, "keyFindings": string[], "recommendations": string[] }
- summary: 2-3 sentences on wind resource suitability in Chinese
- keyFindings: 3-5 specific findings about this route's wind conditions in Chinese
- recommendations: 2-4 wind data improvement recommendations in Chinese
Do NOT invent numbers. Only interpret the provided data.`,
    messages: [
      {
        role: 'user',
        content: `航线风资源评估结果：\n${JSON.stringify(context, null, 2)}\n\n请用中文分析并以JSON格式输出。`,
      },
    ],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const parsed = extractJson(raw)

  return {
    agentName: '航线风资源分析',
    summary: parsed.summary ?? '航线风资源分析完成。',
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
