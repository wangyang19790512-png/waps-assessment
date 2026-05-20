import type {
  AssessmentProject,
  AssessmentResult,
  ScoreBreakdown,
  RiskRegisterItem,
  DataGap,
  NextAction,
} from '@waps/schemas'
import { assessDataCompleteness } from './data-completeness.js'
import { assessVesselSuitability } from './vessel-suitability.js'
import { assessRouteWind, calcEffectiveWindUtilizationRatio } from './route-wind.js'
import { matchWapsType } from './waps-matching.js'
import { calculateFuelSaving, calculateCo2Reduction } from './fuel-saving.js'
import { calculateEconomics } from './capex-opex.js'
import { assessPolicyCompliance } from './policy-compliance.js'
import { assessShippingOperation } from './shipping-operation.js'
import { assessClassRisk } from './class-risk.js'
import { assessStabilityStructure } from './stability-structure.js'

// Spec §4.2 weights
const WEIGHTS = {
  vesselSuitability: 0.20,
  routeWind: 0.20,
  economic: 0.20,
  shippingOperation: 0.15,
  classRisk: 0.10,
  stabilityStructure: 0.10,
  policyCompliance: 0.05,
}

function buildRiskRegister(result: Omit<AssessmentResult, 'risks' | 'dataGaps' | 'nextActions' | 'agentSummaries' | 'generatedAt'>): RiskRegisterItem[] {
  const risks: RiskRegisterItem[] = []
  let id = 1

  result.vesselSuitability.redFlags.forEach(rf => {
    risks.push({ id: `R${id++}`, category: 'structural', severity: 'high', description: rf, mitigation: '委托船舶设计院进行专业评估' })
  })
  result.shippingOperation.operationalRedFlags.forEach(rf => {
    risks.push({ id: `R${id++}`, category: 'operational', severity: 'high', description: rf, mitigation: '制定专项运营程序并进行船员培训' })
  })
  result.classRisk.keyClassConcerns.slice(0, 3).forEach(concern => {
    risks.push({ id: `R${id++}`, category: 'regulatory', severity: 'medium', description: concern, mitigation: '尽早与船级社开展预沟通' })
  })
  if (result.stabilityStructure.keyRisks.length > 0) {
    risks.push({ id: `R${id++}`, category: 'structural', severity: result.stabilityStructure.stabilityRiskLevel === 'high' ? 'critical' : 'high', description: result.stabilityStructure.keyRisks[0], mitigation: '聘请海事设计院进行稳性和结构验算' })
  }
  if (result.economics.paybackYearsBase === null || (result.economics.paybackYearsBase ?? 0) > 12) {
    risks.push({ id: `R${id++}`, category: 'financial', severity: 'medium', description: '经济回收期较长或无法回收，投资价值存在不确定性', mitigation: '完善燃油基线数据，结合政策减排价值综合评估' })
  }

  return risks
}

function buildDataGaps(result: Omit<AssessmentResult, 'risks' | 'dataGaps' | 'nextActions' | 'agentSummaries' | 'generatedAt'>): DataGap[] {
  return result.dataCompleteness.criticalMissingFields.map(field => ({
    field,
    impact: 'critical' as const,
    description: `字段 ${field} 缺失，影响评估可信度`,
    howToObtain: '请联系船东或船级社获取相关资料',
  }))
}

function buildNextActions(result: Omit<AssessmentResult, 'risks' | 'dataGaps' | 'nextActions' | 'agentSummaries' | 'generatedAt'>): NextAction[] {
  const actions: NextAction[] = []

  if (result.dataCompleteness.criticalMissingFields.length > 0) {
    actions.push({
      priority: 'immediate',
      action: `补充关键缺失数据：${result.dataCompleteness.criticalMissingFields.slice(0, 3).join('、')}`,
      responsible: '船东 / 运营方',
    })
  }

  if (result.totalScore >= 70) {
    actions.push({
      priority: 'short_term',
      action: `联系 ${result.classRisk.recommendedClassEngagementStage === 'before_concept_design' ? '船级社开展预设计沟通' : '设备供应商获取初步方案和报价'}`,
      responsible: '项目团队',
    })
    actions.push({
      priority: 'before_next_stage',
      action: '委托有资质的船舶设计院开展详细可行性研究',
      responsible: '船东',
    })
  } else if (result.totalScore >= 55) {
    actions.push({
      priority: 'short_term',
      action: '补充气象和航线风资源数据，提高评估可信度',
      responsible: '项目团队',
    })
  }

  if (result.classRisk.requiresStabilityAssessment) {
    actions.push({
      priority: 'before_next_stage',
      action: '委托船舶设计院完成 WAPS 改装后稳性验算',
      responsible: '船东 / 设计院',
    })
  }

  return actions
}

export function calculateOverallScore(scores: ScoreBreakdown): { totalScore: number; rating: AssessmentResult['rating']; recommendation: AssessmentResult['recommendation'] } {
  const totalScore = Math.round(
    scores.vesselSuitability * WEIGHTS.vesselSuitability +
    scores.routeWind * WEIGHTS.routeWind +
    scores.economic * WEIGHTS.economic +
    scores.shippingOperation * WEIGHTS.shippingOperation +
    scores.classRisk * WEIGHTS.classRisk +
    scores.stabilityStructure * WEIGHTS.stabilityStructure +
    scores.policyCompliance * WEIGHTS.policyCompliance,
  )

  const rating: AssessmentResult['rating'] =
    totalScore >= 85 ? 'A'
    : totalScore >= 70 ? 'B'
    : totalScore >= 55 ? 'C'
    : totalScore >= 40 ? 'D'
    : 'E'

  const recommendation: AssessmentResult['recommendation'] =
    rating === 'A' ? 'proceed_to_detailed_design'
    : rating === 'B' ? 'proceed_with_data_collection'
    : rating === 'C' || rating === 'D' ? 'research_only'
    : 'not_recommended'

  return { totalScore, rating, recommendation }
}

export function runFullAssessment(project: AssessmentProject): AssessmentResult {
  const dataCompleteness = assessDataCompleteness(project)
  const vesselSuitability = assessVesselSuitability(project.vessel, project.deck, project.stability, project.operation)
  const routeWind = assessRouteWind(project.weather, project.route)
  const wapsMatching = matchWapsType(project.vessel, project.deck, project.weather, project.operation)

  const windUtilRatio = calcEffectiveWindUtilizationRatio(project.weather)
  const fuelSaving = calculateFuelSaving(project.fuel, windUtilRatio, project.assumptions)
  const co2Reduction = calculateCo2Reduction(fuelSaving, project.fuel.fuelType)
  const economics = calculateEconomics(wapsMatching.recommendedType, fuelSaving, project.fuel)
  const policyCompliance = assessPolicyCompliance(project.policy, project.route)
  const shippingOperation = assessShippingOperation(project.operation, project.deck)
  const classRisk = assessClassRisk(project.vessel, project.stability, project.deck, wapsMatching.recommendedType)
  const stabilityStructure = assessStabilityStructure(project.stability, project.deck)

  const scores: ScoreBreakdown = {
    vesselSuitability: vesselSuitability.score,
    routeWind: routeWind.score,
    economic: economics.economicScore,
    shippingOperation: shippingOperation.score,
    classRisk: classRisk.score,
    stabilityStructure: stabilityStructure.score,
    policyCompliance: policyCompliance.score,
    dataCompleteness: dataCompleteness.score,
  }

  const { totalScore, rating, recommendation } = calculateOverallScore(scores)

  const partial = {
    projectId: project.id,
    totalScore,
    rating,
    recommendation,
    scores,
    recommendedWapsType: wapsMatching.recommendedType,
    alternativeWapsTypes: wapsMatching.alternativeTypes,
    fuelSaving,
    co2Reduction,
    economics,
    vesselSuitability,
    routeWind,
    wapsMatching,
    policyCompliance,
    shippingOperation,
    classRisk,
    stabilityStructure,
    dataCompleteness,
    agentSummaries: [],
  }

  return {
    ...partial,
    risks: buildRiskRegister(partial),
    dataGaps: buildDataGaps(partial),
    nextActions: buildNextActions(partial),
    generatedAt: new Date().toISOString(),
  }
}
