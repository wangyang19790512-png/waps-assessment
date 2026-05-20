import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { getClient, AGENT_MODEL } from '../client.js'

export async function runEconomicAgent(
  project: AssessmentProject,
  result: AssessmentResult,
): Promise<AgentSummary> {
  const client = getClient()

  const eco = result.economics
  const fs = result.fuelSaving
  const co2 = result.co2Reduction
  const context = {
    economicScore: eco.economicScore,
    capex: { low: eco.capexLowUsd, base: eco.capexBaseUsd, high: eco.capexHighUsd },
    annualOpexUsd: eco.annualOpexUsd,
    annualFuelCostSaving: {
      conservative: eco.annualFuelCostSavingConservativeUsd,
      base: eco.annualFuelCostSavingBaseUsd,
      optimistic: eco.annualFuelCostSavingOptimisticUsd,
    },
    paybackYears: {
      conservative: eco.paybackYearsConservative,
      base: eco.paybackYearsBase,
      optimistic: eco.paybackYearsOptimistic,
    },
    fuelSavingRate: { conservative: fs.conservativeRate, base: fs.baseRate, optimistic: fs.optimisticRate },
    co2Reduction: { conservative: co2.conservativeCo2ReductionT, base: co2.baseCo2ReductionT, optimistic: co2.optimisticCo2ReductionT },
    sensitivityNotes: eco.sensitivityNotes,
    fuelPriceUsdPerT: project.fuel.fuelPriceUsdPerT,
    annualFuelConsumptionT: project.fuel.annualFuelConsumptionT,
  }

  const msg = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 700,
    system: `You are a maritime finance analyst specializing in green shipping investment analysis.
Your task: interpret WAPS economic feasibility results and provide investment commentary in Chinese.
Output JSON only: { "summary": string, "keyFindings": string[], "recommendations": string[] }
- summary: 2-3 sentences on economic feasibility in Chinese
- keyFindings: 3-5 specific economic findings in Chinese (mention payback, CAPEX, sensitivity)
- recommendations: 3-4 financial improvement or risk mitigation actions in Chinese
Do NOT invent numbers. Only interpret the data provided.`,
    messages: [
      {
        role: 'user',
        content: `经济性分析结果：\n${JSON.stringify(context, null, 2)}\n\n请用中文分析并以JSON格式输出。`,
      },
    ],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const parsed = extractJson(raw)

  return {
    agentName: '经济性分析',
    summary: parsed.summary ?? '经济性分析完成。',
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
