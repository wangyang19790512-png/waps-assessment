import type {
  VesselProfile,
  DeckProfile,
  StabilityProfile,
  OperationProfile,
  VesselSuitabilityResult,
} from '@waps/schemas'

const VESSEL_TYPE_POINTS: Record<string, number> = {
  bulk_carrier: 25,
  tanker: 22,
  general_cargo: 20,
  research: 18,
  training: 16,
  container: 14,
  ferry: 10,
  offshore_support: 8,
  port_service: 5,
  other: 10,
}

function speedPoints(kn: number): number {
  if (kn <= 10) return 20
  if (kn <= 12) return 16
  if (kn <= 15) return 10
  if (kn <= 18) return 5
  return 2
}

function agePoints(yearBuilt: number | undefined): number {
  if (!yearBuilt) return 8
  const age = new Date().getFullYear() - yearBuilt
  if (age < 8) return 15
  if (age < 15) return 12
  if (age < 20) return 8
  if (age < 25) return 4
  return 2
}

function deckAreaPoints(area: number | undefined): number {
  if (area === undefined) return 10
  if (area >= 200) return 20
  if (area >= 100) return 15
  if (area >= 50) return 10
  return 5
}

function operatingDaysPoints(days: number | undefined): number {
  if (days === undefined) return 6
  if (days >= 300) return 10
  if (days >= 250) return 8
  if (days >= 200) return 6
  if (days >= 150) return 4
  return 2
}

function stabilityPoints(gm: number | undefined): number {
  if (gm === undefined) return 5
  if (gm >= 2.0) return 10
  if (gm >= 1.5) return 8
  if (gm >= 1.0) return 5
  return 2
}

const CONFLICT_DEDUCTIONS: Record<string, number> = {
  none: 0, low: 0, medium: 0, high: 0, unknown: 0,
}

export function assessVesselSuitability(
  vessel: VesselProfile,
  deck: DeckProfile,
  stability: StabilityProfile | undefined,
  operation: OperationProfile,
): VesselSuitabilityResult {
  let score =
    (VESSEL_TYPE_POINTS[vessel.vesselType] ?? 10) +
    speedPoints(vessel.serviceSpeedKn) +
    agePoints(vessel.yearBuilt) +
    deckAreaPoints(deck.availableDeckAreaM2) +
    operatingDaysPoints(operation.annualOperatingDays) +
    stabilityPoints(stability?.gmM)

  const positiveFactors: string[] = []
  const constraints: string[] = []
  const redFlags: string[] = []

  // Positive factors
  if ((VESSEL_TYPE_POINTS[vessel.vesselType] ?? 0) >= 20) {
    positiveFactors.push(`船型（${vessel.vesselType}）非常适合 WAPS 改造`)
  }
  if (vessel.serviceSpeedKn <= 12) {
    positiveFactors.push(`服务航速 ${vessel.serviceSpeedKn} kn，有利于风能推进贡献`)
  }
  if ((deck.availableDeckAreaM2 ?? 0) >= 100) {
    positiveFactors.push(`甲板可用面积 ${deck.availableDeckAreaM2} m²，安装空间充裕`)
  }
  if ((operation.annualOperatingDays ?? 0) >= 280) {
    positiveFactors.push(`年运营天数 ${operation.annualOperatingDays} 天，经济收益高`)
  }

  // Deductions and constraints
  if (deck.cargoOperationConflict === 'high') {
    score -= 10
    constraints.push('装卸作业与 WAPS 存在高度冲突，需专项方案规避')
  } else if (deck.cargoOperationConflict === 'medium') {
    score -= 4
    constraints.push('装卸作业与 WAPS 存在中度冲突，需优化布置')
  }

  if (deck.craneOperationConflict === 'high') {
    score -= 8
    constraints.push('吊机作业范围与 WAPS 安装冲突，需重新规划')
  } else if (deck.craneOperationConflict === 'medium') {
    score -= 3
    constraints.push('吊机作业存在一定干涉，需布置优化')
  }

  if (deck.bridgeVisibilityImpact === 'high') {
    score -= 5
    constraints.push('WAPS 安装可能影响驾驶台视线，需满足 COLREGS 要求')
  } else if (deck.bridgeVisibilityImpact === 'medium') {
    score -= 2
    constraints.push('驾驶台视线存在一定影响，需视线分析')
  }

  // Red flags
  if (vessel.serviceSpeedKn > 18) {
    redFlags.push(`高航速（${vessel.serviceSpeedKn} kn）显著降低风能推进贡献比例`)
  }
  const age = vessel.yearBuilt ? new Date().getFullYear() - vessel.yearBuilt : 0
  if (age > 25) {
    redFlags.push(`船龄 ${age} 年，改造投资回收期可能超过剩余运营年限`)
  }
  if ((deck.availableDeckAreaM2 ?? Infinity) < 30) {
    redFlags.push('可用甲板面积极小（<30m²），仅软帆或风筝系统可能可行')
  }
  if (stability?.gmM !== undefined && stability.gmM < 0.8) {
    redFlags.push(`初稳性高度 GM=${stability.gmM}m 偏低，WAPS 顶部重量风险极高，必须进行专业稳性计算`)
  }
  if (!stability?.stabilityBookletAvailable && !stability?.gmM) {
    redFlags.push('缺少稳性基础数据，无法评估重量和重心影响，建议优先补充')
  }

  score = Math.max(0, Math.min(100, score))

  const level: VesselSuitabilityResult['level'] =
    score >= 80 ? 'high'
    : score >= 65 ? 'medium_high'
    : score >= 50 ? 'medium'
    : score >= 35 ? 'low'
    : 'not_recommended'

  return {
    score,
    level,
    positiveFactors,
    constraints,
    redFlags,
    requiresNavalArchitectReview:
      redFlags.length > 0 ||
      !stability?.stabilityBookletAvailable ||
      !stability?.structuralDrawingsAvailable,
  }
}
