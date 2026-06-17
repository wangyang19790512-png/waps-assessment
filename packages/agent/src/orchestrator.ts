import type { AssessmentProject, AssessmentResult, AgentSummary } from '@waps/schemas'
import { runDataGapAgent } from './agents/data-gap-agent.js'
import { runVesselAgent } from './agents/vessel-agent.js'
import { runRouteAgent } from './agents/route-agent.js'
import { runWapsTechAgent } from './agents/waps-tech-agent.js'
import { runEconomicAgent } from './agents/economic-agent.js'
import { runPolicyAgent } from './agents/policy-agent.js'
import { runShippingAgent } from './agents/shipping-agent.js'
import { runClassRiskAgent } from './agents/class-risk-agent.js'
import { runStabilityAgent } from './agents/stability-agent.js'
import { runSynthesisAgent } from './agents/synthesis-agent.js'

export interface AgentRunOptions {
  onProgress?: (agentName: string, index: number, total: number) => void
}

export async function runAllAgents(
  project: AssessmentProject,
  result: AssessmentResult,
  options: AgentRunOptions = {},
): Promise<AgentSummary[]> {
  const { onProgress } = options
  const summaries: AgentSummary[] = []

  const specialists: Array<{
    name: string
    run: () => Promise<AgentSummary>
  }> = [
    { name: '数据完整性分析', run: () => runDataGapAgent(project, result) },
    { name: '船型适配分析', run: () => runVesselAgent(project, result) },
    { name: '航线风资源分析', run: () => runRouteAgent(project, result) },
    { name: 'WAPS技术路线分析', run: () => runWapsTechAgent(project, result) },
    { name: '经济性分析', run: () => runEconomicAgent(project, result) },
    { name: '政策合规价值分析', run: () => runPolicyAgent(project, result) },
    { name: '航运运营影响分析', run: () => runShippingAgent(project, result) },
    { name: '船级社风险分析', run: () => runClassRiskAgent(project, result) },
    { name: '稳性与结构分析', run: () => runStabilityAgent(project, result) },
  ]

  const total = specialists.length + 1
  let completed = 0

  const settledResults = await Promise.allSettled(
    specialists.map(async (spec) => {
      const summary = await spec.run()
      completed++
      onProgress?.(spec.name, completed, total)
      return summary
    })
  )

  for (let i = 0; i < settledResults.length; i++) {
    const r = settledResults[i]
    if (r.status === 'fulfilled') {
      summaries.push(r.value)
    } else {
      console.error(`Agent ${specialists[i].name} failed:`, r.reason)
      summaries.push({
        agentName: specialists[i].name,
        summary: '（本模块分析暂时不可用）',
        keyFindings: [],
        recommendations: [],
      })
    }
  }

  onProgress?.('综合评估报告', total, total)
  try {
    const synthesis = await runSynthesisAgent(project, result, summaries)
    summaries.push(synthesis)
  } catch (err) {
    console.error('Synthesis agent failed:', err)
    summaries.push({
      agentName: '综合评估报告',
      summary: '（综合分析暂时不可用）',
      keyFindings: [],
      recommendations: [],
    })
  }

  return summaries
}
