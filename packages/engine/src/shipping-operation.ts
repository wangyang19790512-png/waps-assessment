import type {
  OperationProfile,
  DeckProfile,
  ShippingOperationResult,
} from '@waps/schemas'

type ConflictLevel = 'none' | 'low' | 'medium' | 'high' | 'unknown'
type SkillLevel = 'high' | 'medium' | 'low' | 'unknown'

const CONFLICT_DEDUCTIONS: Record<ConflictLevel, number> = {
  none: 0, low: 4, medium: 12, high: 25, unknown: 6,
}
const CRANE_DEDUCTIONS: Record<ConflictLevel, number> = {
  none: 0, low: 3, medium: 10, high: 20, unknown: 5,
}
const BRIDGE_DEDUCTIONS: Record<ConflictLevel, number> = {
  none: 0, low: 2, medium: 7, high: 15, unknown: 4,
}
const PORT_DEDUCTIONS: Record<ConflictLevel, number> = {
  none: 0, low: 2, medium: 7, high: 15, unknown: 4,
}
const SCHEDULE_DEDUCTIONS: Record<ConflictLevel, number> = {
  none: 0, low: 1, medium: 5, high: 10, unknown: 3,
}
const INSURANCE_DEDUCTIONS: Record<ConflictLevel, number> = {
  none: 0, low: 1, medium: 3, high: 8, unknown: 2,
}
const SKILL_ADJUSTMENTS: Record<SkillLevel, number> = {
  high: 3, medium: 0, low: -5, unknown: -2,
}

export function assessShippingOperation(
  operation: OperationProfile,
  deck: DeckProfile,
): ShippingOperationResult {
  let score = 100
  const majorConflicts: string[] = []
  const mitigationMeasures: string[] = []
  const operationalRedFlags: string[] = []

  const cargoConflict = deck.cargoOperationConflict ?? 'unknown'
  const craneConflict = deck.craneOperationConflict ?? 'unknown'
  const bridgeImpact = deck.bridgeVisibilityImpact ?? 'unknown'
  const portRestriction = operation.portRestrictionLevel ?? 'unknown'
  const schedSensitivity = operation.scheduleSensitivity ?? 'unknown'
  const insuranceConcern = operation.insuranceConcernLevel ?? 'unknown'
  const crewSkill = operation.crewSkillLevel ?? 'unknown'
  const maintCap = operation.maintenanceCapability ?? 'unknown'

  score -= CONFLICT_DEDUCTIONS[cargoConflict]
  score -= CRANE_DEDUCTIONS[craneConflict]
  score -= BRIDGE_DEDUCTIONS[bridgeImpact]
  score -= PORT_DEDUCTIONS[portRestriction]
  score -= SCHEDULE_DEDUCTIONS[schedSensitivity]
  score -= INSURANCE_DEDUCTIONS[insuranceConcern]
  score += SKILL_ADJUSTMENTS[crewSkill]
  score += SKILL_ADJUSTMENTS[maintCap as SkillLevel]

  if (cargoConflict === 'high') {
    majorConflicts.push('装卸作业与 WAPS 高度冲突，可能影响货物周转效率')
    mitigationMeasures.push('需要专项甲板布置优化方案，与货主协商操作程序')
    operationalRedFlags.push('货物装卸是主要运营瓶颈，建议优先验证可行性')
  }

  if (craneConflict === 'high') {
    majorConflicts.push('吊机工作范围受 WAPS 安装干涉')
    mitigationMeasures.push('需重新规划吊机旋转范围，或选择低干涉 WAPS 类型')
  }

  if (bridgeImpact === 'high') {
    majorConflicts.push('驾驶台视线受 WAPS 遮挡，不满足 COLREGS 要求')
    mitigationMeasures.push('需进行视线分析（sight line study），调整安装位置')
    operationalRedFlags.push('视线问题是安全红线，不满足视线要求无法获得船级社认可')
  }

  if (portRestriction === 'high') {
    majorConflicts.push('港口限制（高度/净空/装卸设施）可能制约 WAPS 运营')
    mitigationMeasures.push('需逐一核查主要靠港的净空高度和作业限制')
  }

  if (crewSkill === 'low') {
    operationalRedFlags.push('船员技能水平低，WAPS 操作培训需求高，存在操作安全风险')
  }

  if (schedSensitivity === 'high') {
    mitigationMeasures.push('WAPS 系统需配备快速收放功能，确保不影响进出港效率')
  }

  score = Math.max(0, Math.min(100, score))

  const impactLevel: ShippingOperationResult['impactLevel'] =
    score >= 80 ? 'low'
    : score >= 65 ? 'medium'
    : score >= 50 ? 'medium_high'
    : score >= 0 ? 'high'
    : 'unknown'

  return {
    score,
    impactLevel,
    majorConflicts,
    mitigationMeasures,
    operationalRedFlags,
    crewTrainingRequired: crewSkill !== 'high',
    portOperationReviewRequired: portRestriction === 'high' || portRestriction === 'medium',
    insuranceReviewRequired: insuranceConcern === 'high' || insuranceConcern === 'medium',
  }
}
