import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { getClient, AGENT_MODEL } from '../client.js'

export async function runClassRiskAgent(
  project: AssessmentProject,
  result: AssessmentResult,
): Promise<AgentSummary> {
  const client = getClient()

  const cr = result.classRisk
  const context = {
    classRiskScore: cr.score,
    approvalComplexity: cr.approvalComplexity,
    likelyRequiredDocuments: cr.likelyRequiredDocuments,
    keyClassConcerns: cr.keyClassConcerns,
    recommendedClassEngagementStage: cr.recommendedClassEngagementStage,
    requiresFmea: cr.requiresFmea,
    requiresStabilityAssessment: cr.requiresStabilityAssessment,
    requiresStructuralReview: cr.requiresStructuralReview,
    requiresSeaTrialPlan: cr.requiresSeaTrialPlan,
    classSociety: project.vessel.classSociety,
  }

  const msg = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 600,
    system: `You are a classification society liaison specialist with expertise in WAPS type approval processes (DNV, ABS, LR, BV, ClassNK, CCS).
Your task: interpret classification society risk results and provide approval strategy commentary in Chinese.
Output JSON only: { "summary": string, "keyFindings": string[], "recommendations": string[] }
- summary: 2-3 sentences on classification approval complexity in Chinese
- keyFindings: 3-5 specific class approval findings in Chinese
- recommendations: 3-4 class engagement strategy actions in Chinese
Do NOT invent classification requirements. Only interpret the provided data.`,
    messages: [
      {
        role: 'user',
        content: `船级社风险与认证路径评估结果：\n${JSON.stringify(context, null, 2)}\n\n请用中文分析并以JSON格式输出。`,
      },
    ],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const parsed = extractJson(raw)

  return {
    agentName: '船级社风险分析',
    summary: parsed.summary ?? '船级社风险分析完成。',
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
