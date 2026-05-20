import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { getClient, AGENT_MODEL } from '../client.js'

export async function runShippingAgent(
  project: AssessmentProject,
  result: AssessmentResult,
): Promise<AgentSummary> {
  const client = getClient()

  const so = result.shippingOperation
  const op = project.operation
  const context = {
    operationScore: so.score,
    impactLevel: so.impactLevel,
    majorConflicts: so.majorConflicts,
    mitigationMeasures: so.mitigationMeasures,
    operationalRedFlags: so.operationalRedFlags,
    crewTrainingRequired: so.crewTrainingRequired,
    portOperationReviewRequired: so.portOperationReviewRequired,
    insuranceReviewRequired: so.insuranceReviewRequired,
    cargoOperationType: op.cargoOperationType,
    scheduleSensitivity: op.scheduleSensitivity,
    crewSkillLevel: op.crewSkillLevel,
  }

  const msg = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 600,
    system: `You are a shipping operations specialist with expertise in WAPS integration into commercial vessel operations.
Your task: interpret shipping operation impact results and provide operational commentary in Chinese.
Output JSON only: { "summary": string, "keyFindings": string[], "recommendations": string[] }
- summary: 2-3 sentences on operational impact in Chinese
- keyFindings: 3-5 specific operational findings in Chinese
- recommendations: 3-4 operational preparation actions in Chinese
Do NOT invent operational details. Only interpret the provided data.`,
    messages: [
      {
        role: 'user',
        content: `航运管理与运营影响评估结果：\n${JSON.stringify(context, null, 2)}\n\n请用中文分析并以JSON格式输出。`,
      },
    ],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const parsed = extractJson(raw)

  return {
    agentName: '航运运营影响分析',
    summary: parsed.summary ?? '航运运营影响分析完成。',
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
