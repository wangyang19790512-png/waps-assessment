import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { getClient, AGENT_MODEL } from '../client.js'

export async function runPolicyAgent(
  project: AssessmentProject,
  result: AssessmentResult,
): Promise<AgentSummary> {
  const client = getClient()

  const pc = result.policyCompliance
  const pol = project.policy
  const context = {
    policyScore: pc.score,
    applicablePolicies: pc.applicablePolicies,
    benefits: {
      imoCii: pc.imoCiiBenefit,
      eexi: pc.eexiBenefit,
      fuelEu: pc.fuelEuBenefit,
      euEts: pc.euEtsBenefit,
      esg: pc.esgValue,
      greenFinance: pc.greenFinanceValue,
    },
    policyUncertainties: pc.policyUncertainties,
    notes: pc.notes,
    callsEuPorts: project.route.callsEuPorts,
  }

  const msg = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 600,
    system: `You are a maritime regulatory compliance expert specializing in IMO CII, EEXI, EU ETS, and ESG frameworks.
Your task: interpret WAPS policy compliance value results and provide regulatory commentary in Chinese.
Output JSON only: { "summary": string, "keyFindings": string[], "recommendations": string[] }
- summary: 2-3 sentences on regulatory and policy value in Chinese
- keyFindings: 3-5 specific policy findings in Chinese
- recommendations: 2-4 compliance action items in Chinese
Do NOT invent regulations or policy numbers. Only interpret the provided data.`,
    messages: [
      {
        role: 'user',
        content: `政策合规价值评估结果：\n${JSON.stringify(context, null, 2)}\n\n请用中文分析并以JSON格式输出。`,
      },
    ],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const parsed = extractJson(raw)

  return {
    agentName: '政策合规价值分析',
    summary: parsed.summary ?? '政策合规价值分析完成。',
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
