import type {
  PolicyProfile,
  RouteProfile,
  PolicyComplianceResult,
} from '@waps/schemas'

export function assessPolicyCompliance(
  policy: PolicyProfile,
  route: RouteProfile,
): PolicyComplianceResult {
  let rawScore = 0
  const applicablePolicies: string[] = []
  const policyUncertainties: string[] = []
  const notes: string[] = []

  // IMO CII + EEXI (max 30)
  if (policy.imoCiiApplicable && policy.eexiApplicable) {
    rawScore += 30
    applicablePolicies.push('IMO CII', 'IMO EEXI')
    notes.push('WAPS 节油直接改善 CII 年度评级，同时可能辅助 EEXI 达标')
  } else if (policy.imoCiiApplicable) {
    rawScore += 20
    applicablePolicies.push('IMO CII')
    notes.push('WAPS 节油量将计入 CII 实际碳强度计算')
  } else if (policy.eexiApplicable) {
    rawScore += 15
    applicablePolicies.push('IMO EEXI')
    policyUncertainties.push('EEXI 已为船舶固有指数，WAPS 改装后需重新计算')
  }

  if (policy.seempApplicable) {
    applicablePolicies.push('SEEMP')
    notes.push('WAPS 改装应纳入 SEEMP 第三部分节能措施')
  }

  // FuelEU Maritime (max 20) — only if calling EU ports
  if (policy.fuelEuApplicable || route.callsEuPorts) {
    rawScore += 20
    applicablePolicies.push('FuelEU Maritime')
    notes.push('停靠欧盟港口的航次受 FuelEU Maritime 管辖，WAPS 节油有助于降低 GHG 强度缺口')
    if (!route.callsEuPorts && policy.fuelEuApplicable) {
      policyUncertainties.push('FuelEU 适用性需根据实际港口确认')
    }
  }

  // EU ETS (max 15)
  if (policy.euEtsApplicable || route.callsEuPorts) {
    rawScore += 15
    applicablePolicies.push('EU ETS')
    notes.push('停靠欧盟港口须为 CO₂ 排放购买碳配额，WAPS 节油直接减少配额成本')
  }

  // ESG (max 20)
  if (policy.esgReportingRequired) {
    rawScore += 20
    applicablePolicies.push('ESG 披露')
    notes.push('WAPS 改装可提升公司 ESG 评分，支持绿色融资和 ESG 报告')
  }

  // Green Finance (max 15)
  if (policy.greenFinanceInterest) {
    rawScore += 15
    applicablePolicies.push('绿色金融 / 绿色债券')
    notes.push('WAPS 项目可申请绿色船舶贷款或绿色债券，降低融资成本')
  }

  // Domestic program (max 10)
  if (policy.domesticGreenShippingProgram) {
    rawScore += 10
    applicablePolicies.push('国内绿色航运示范计划')
    notes.push('可申请国内绿色航运补贴或示范项目资金支持')
  }

  // Normalize to 100
  const maxPossible = 110
  const score = Math.min(100, Math.round((rawScore / maxPossible) * 100))

  policyUncertainties.push('政策法规持续演变，评估结论需随政策更新动态维护')
  notes.push('本评估不构成合规意见，不可替代专业法律或合规顾问建议')

  const benefitLevel = (applicable: boolean | undefined): PolicyComplianceResult['imoCiiBenefit'] => {
    if (!applicable) return 'not_applicable'
    return score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low'
  }

  return {
    score,
    imoCiiBenefit: policy.imoCiiApplicable ? (score >= 60 ? 'high' : 'medium') : 'not_applicable',
    eexiBenefit: policy.eexiApplicable ? 'medium' : 'not_applicable',
    fuelEuBenefit: (policy.fuelEuApplicable || route.callsEuPorts) ? 'high' : 'not_applicable',
    euEtsBenefit: (policy.euEtsApplicable || route.callsEuPorts) ? 'high' : 'not_applicable',
    esgValue: policy.esgReportingRequired ? 'high' : 'unknown',
    greenFinanceValue: policy.greenFinanceInterest ? 'high' : 'unknown',
    applicablePolicies,
    policyUncertainties,
    notes,
  }
}
