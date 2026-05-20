import type {
  VesselProfile,
  StabilityProfile,
  DeckProfile,
  WapsType,
  ClassRiskResult,
} from '@waps/schemas'

export function assessClassRisk(
  vessel: VesselProfile,
  stability: StabilityProfile | undefined,
  deck: DeckProfile,
  wapsType: WapsType,
): ClassRiskResult {
  let score = 100
  const keyClassConcerns: string[] = []
  const likelyRequiredDocuments: string[] = [
    '改装申请书（Application for Approval）',
    '改装描述文件（Modification Description）',
  ]

  // Stability documents
  if (!stability?.stabilityBookletAvailable) {
    score -= 15
    keyClassConcerns.push('稳性手册缺失，船级社将要求提交更新的稳性计算书')
    likelyRequiredDocuments.push('更新后的稳性计算书')
  }
  if (!stability?.structuralDrawingsAvailable) {
    score -= 15
    keyClassConcerns.push('结构图纸缺失，甲板基座设计无法验证，船级社将要求提交')
    likelyRequiredDocuments.push('甲板结构图（含加强方案）')
  }
  if (!deck.generalArrangementAvailable) {
    score -= 10
    keyClassConcerns.push('总布置图未提供，安装位置合理性无法评估')
    likelyRequiredDocuments.push('总布置图（General Arrangement）')
  }
  if (!stability?.incliningTestDataAvailable) {
    score -= 5
    likelyRequiredDocuments.push('重量与重心计算书')
  }

  // GM concerns
  const gm = stability?.gmM
  if (gm !== undefined) {
    if (gm < 1.0) {
      score -= 20
      keyClassConcerns.push(`初稳性高度 GM=${gm}m 偏低，WAPS 顶部重量可能导致稳性不满足规范要求`)
    } else if (gm < 1.5) {
      score -= 10
      keyClassConcerns.push(`GM=${gm}m，安装 WAPS 后需重新验证稳性余量`)
    }
  } else {
    score -= 8
    keyClassConcerns.push('GM 未知，无法预判稳性影响，风险等级提高')
  }

  // Additional weight margin
  const addlWeight = stability?.maxAllowableAdditionalWeightT
  if (addlWeight !== undefined) {
    if (addlWeight < 20) {
      score -= 15
      keyClassConcerns.push(`允许附加重量仅 ${addlWeight}t，WAPS 基础重量可能超限`)
    } else if (addlWeight < 50) {
      score -= 5
    }
  }

  // WAPS type specific risks
  if (wapsType === 'rigid_wing_sail') {
    score -= 10
    keyClassConcerns.push('硬翼帆风载荷大，甲板基座和船体结构需要详细加强计算')
    likelyRequiredDocuments.push('风载荷计算书', 'FMEA（故障模式与影响分析）', '应急收帆程序')
  } else if (wapsType === 'rotor_sail') {
    score -= 5
    keyClassConcerns.push('转子帆旋转机构需提供故障安全停止设计文件')
    likelyRequiredDocuments.push('转子帆控制系统安全分析', '应急停止程序')
  } else if (wapsType === 'kite_system') {
    score -= 8
    keyClassConcerns.push('风筝系统需提供应急分离机构和安全规程')
    likelyRequiredDocuments.push('风筝系统应急分离程序', '操作手册')
  }

  // Standard docs for all WAPS
  likelyRequiredDocuments.push(
    '稳性验证报告（含 WAPS 重量和重心）',
    '甲板基座结构计算书',
    '控制系统描述文件',
    '操作手册（含应急停止程序）',
    '船员培训计划',
  )

  score = Math.max(0, Math.min(100, score))

  const approvalComplexity: ClassRiskResult['approvalComplexity'] =
    score >= 75 ? 'low'
    : score >= 60 ? 'medium'
    : score >= 45 ? 'medium_high'
    : 'high'

  const requiresFmea = wapsType === 'rigid_wing_sail' || wapsType === 'kite_system'
  const requiresStabilityAssessment = !stability?.stabilityBookletAvailable || (gm !== undefined && gm < 1.5) || gm === undefined
  const requiresStructuralReview = !stability?.structuralDrawingsAvailable

  return {
    score,
    approvalComplexity,
    likelyRequiredDocuments: [...new Set(likelyRequiredDocuments)],
    keyClassConcerns,
    recommendedClassEngagementStage: score < 60
      ? 'before_concept_design'
      : score < 75
      ? 'before_detailed_engineering'
      : 'before_installation',
    requiresFmea,
    requiresStabilityAssessment,
    requiresStructuralReview,
    requiresSeaTrialPlan: true,
  }
}
