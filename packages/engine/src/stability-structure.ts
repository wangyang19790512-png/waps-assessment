import type {
  StabilityProfile,
  DeckProfile,
  StabilityStructureResult,
} from '@waps/schemas'

export function assessStabilityStructure(
  stability: StabilityProfile | undefined,
  deck: DeckProfile,
): StabilityStructureResult {
  let score = 0
  const keyRisks: string[] = []
  const missingCriticalData: string[] = []

  // Document availability (max 55)
  if (stability?.stabilityBookletAvailable) score += 20
  else missingCriticalData.push('稳性手册')

  if (stability?.structuralDrawingsAvailable) score += 20
  else missingCriticalData.push('结构图纸')

  if (stability?.incliningTestDataAvailable) score += 15
  else missingCriticalData.push('倾斜试验数据')

  // GM assessment (max 20)
  const gm = stability?.gmM
  if (gm !== undefined) {
    if (gm >= 2.0) { score += 20 }
    else if (gm >= 1.5) { score += 15 }
    else if (gm >= 1.0) { score += 10; keyRisks.push(`GM=${gm}m 偏低，安装 WAPS 后需验证稳性余量`) }
    else { score += 3; keyRisks.push(`GM=${gm}m 严重偏低，WAPS 顶部重量风险极高`) }
  } else {
    score += 10
    keyRisks.push('GM 未知，无法定量评估稳性影响')
    missingCriticalData.push('初稳性高度 GM')
  }

  // Weight margin (max 15)
  const addlWeight = stability?.maxAllowableAdditionalWeightT
  if (addlWeight !== undefined) {
    if (addlWeight >= 50) score += 15
    else if (addlWeight >= 20) { score += 10 }
    else { score += 3; keyRisks.push(`允许附加重量仅 ${addlWeight}t，多数 WAPS 方案将超限`) }
  } else {
    missingCriticalData.push('最大允许附加重量')
  }

  // Deck load limit (max 10)
  const deckLoad = stability?.deckLoadLimitTPerM2
  if (deckLoad !== undefined) {
    if (deckLoad >= 4) score += 10
    else if (deckLoad >= 2) score += 7
    else { score += 3; keyRisks.push(`甲板载荷限制 ${deckLoad} t/m²，WAPS 基础局部载荷需验算`) }
  }

  score = Math.min(100, score)

  const dataScore = score
  const stabilityRiskLevel: StabilityStructureResult['stabilityRiskLevel'] =
    !stability?.stabilityBookletAvailable && gm === undefined ? 'unknown'
    : (gm !== undefined && gm < 1.0) ? 'high'
    : (gm !== undefined && gm < 1.5) ? 'medium_high'
    : dataScore >= 60 ? 'low'
    : 'medium'

  const structureRiskLevel: StabilityStructureResult['structureRiskLevel'] =
    !stability?.structuralDrawingsAvailable ? 'unknown'
    : (addlWeight !== undefined && addlWeight < 20) ? 'high'
    : dataScore >= 50 ? 'low'
    : 'medium'

  return {
    score,
    stabilityRiskLevel,
    structureRiskLevel,
    requiresNavalArchitectReview: missingCriticalData.length > 0 || keyRisks.length > 0,
    requiresDeckFoundationReview: !stability?.structuralDrawingsAvailable,
    keyRisks,
    missingCriticalData,
  }
}
