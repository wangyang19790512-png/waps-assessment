import type {
  AssessmentProject,
  DataCompletenessResult,
} from '@waps/schemas'

interface FieldCheck {
  field: string
  present: boolean
  critical: boolean
  description: string
  howToObtain: string
}

function checkPresent(value: unknown): boolean {
  return value !== undefined && value !== null
}

export function assessDataCompleteness(project: AssessmentProject): DataCompletenessResult {
  const checks: FieldCheck[] = [
    // Vessel dimensions (weight 10%)
    { field: 'vessel.loaM', present: checkPresent(project.vessel.loaM), critical: true, description: '船舶总长 LOA', howToObtain: '船舶证书或船级社记录' },
    { field: 'vessel.beamM', present: checkPresent(project.vessel.beamM), critical: true, description: '型宽', howToObtain: '船舶证书' },
    { field: 'vessel.vesselType', present: checkPresent(project.vessel.vesselType), critical: true, description: '船舶类型', howToObtain: '船东提供' },
    { field: 'vessel.serviceSpeedKn', present: checkPresent(project.vessel.serviceSpeedKn), critical: true, description: '服务航速', howToObtain: '船东或运营记录' },
    { field: 'vessel.yearBuilt', present: checkPresent(project.vessel.yearBuilt), critical: false, description: '建造年份', howToObtain: '船级社记录' },
    { field: 'vessel.mainEnginePowerKw', present: checkPresent(project.vessel.mainEnginePowerKw), critical: false, description: '主机功率', howToObtain: '主机证书或船级社记录' },

    // Engine and fuel (weight 15%)
    { field: 'fuel.annualFuelConsumptionT', present: checkPresent(project.fuel.annualFuelConsumptionT), critical: true, description: '年燃油消耗量', howToObtain: '船东运营记录或加油日志' },
    { field: 'fuel.fuelPriceUsdPerT', present: checkPresent(project.fuel.fuelPriceUsdPerT), critical: true, description: '燃油价格', howToObtain: '船东采购记录或市场价格' },
    { field: 'fuel.annualOperatingDays', present: checkPresent(project.fuel.annualOperatingDays), critical: false, description: '年运营天数', howToObtain: '船东运营计划' },
    { field: 'fuel.fuelType', present: checkPresent(project.fuel.fuelType), critical: true, description: '燃油类型', howToObtain: '船东提供' },

    // Route and AIS (weight 20%)
    { field: 'route.routeDistanceNm', present: checkPresent(project.route.routeDistanceNm), critical: true, description: '航线距离', howToObtain: '航线图或 AIS 数据' },
    { field: 'route.voyageCountPerYear', present: checkPresent(project.route.voyageCountPerYear), critical: true, description: '年航次数', howToObtain: '船东运营计划' },
    { field: 'route.originPort', present: checkPresent(project.route.originPort), critical: false, description: '起始港口', howToObtain: '船东提供' },
    { field: 'route.destinationPort', present: checkPresent(project.route.destinationPort), critical: false, description: '目的港口', howToObtain: '船东提供' },
    { field: 'route.seasonalPattern', present: checkPresent(project.route.seasonalPattern), critical: false, description: '季节性模式', howToObtain: '航线气象资料' },

    // Weather (weight 15%)
    { field: 'weather.averageTrueWindSpeedMs', present: checkPresent(project.weather?.averageTrueWindSpeedMs), critical: true, description: '平均真风速', howToObtain: 'ERA5/NOAA 数据或商业气象服务' },
    { field: 'weather.favorableWindPercentage', present: checkPresent(project.weather?.favorableWindPercentage), critical: true, description: '有利风向占比', howToObtain: '航线气象分析' },
    { field: 'weather.seasonalVariability', present: checkPresent(project.weather?.seasonalVariability), critical: false, description: '季节性变化', howToObtain: '多年气象数据分析' },

    // Deck space (weight 15%)
    { field: 'deck.availableDeckAreaM2', present: checkPresent(project.deck.availableDeckAreaM2), critical: true, description: '可用甲板面积', howToObtain: '总布置图或甲板实测' },
    { field: 'deck.cargoOperationConflict', present: checkPresent(project.deck.cargoOperationConflict), critical: true, description: '装卸作业冲突评估', howToObtain: '船东装卸操作规程' },
    { field: 'deck.maxAllowableInstallationHeightM', present: checkPresent(project.deck.maxAllowableInstallationHeightM), critical: false, description: '最大安装高度', howToObtain: '港口限制和桥楼视线分析' },
    { field: 'deck.generalArrangementAvailable', present: project.deck.generalArrangementAvailable === true, critical: false, description: '总布置图', howToObtain: '船级社或船东存档' },

    // Stability and structure (weight 15%)
    { field: 'stability.gmM', present: checkPresent(project.stability?.gmM), critical: true, description: '初稳性高度 GM', howToObtain: '稳性手册或倾斜试验数据' },
    { field: 'stability.maxAllowableAdditionalWeightT', present: checkPresent(project.stability?.maxAllowableAdditionalWeightT), critical: true, description: '最大允许附加重量', howToObtain: '稳性手册' },
    { field: 'stability.stabilityBookletAvailable', present: project.stability?.stabilityBookletAvailable === true, critical: false, description: '稳性手册', howToObtain: '船级社档案' },
    { field: 'stability.structuralDrawingsAvailable', present: project.stability?.structuralDrawingsAvailable === true, critical: false, description: '结构图纸', howToObtain: '船级社或造船厂档案' },

    // Policy and operation (weight 10%)
    { field: 'operation.annualOperatingDays', present: checkPresent(project.operation.annualOperatingDays), critical: false, description: '年运营天数', howToObtain: '船东运营计划' },
    { field: 'operation.crewSkillLevel', present: checkPresent(project.operation.crewSkillLevel), critical: false, description: '船员技能水平', howToObtain: '船东人力资源评估' },
    { field: 'policy.imoCiiApplicable', present: checkPresent(project.policy.imoCiiApplicable), critical: false, description: 'IMO CII 适用性', howToObtain: '船舶参数核查' },
  ]

  const criticalChecks = checks.filter(c => c.critical)
  const optionalChecks = checks.filter(c => !c.critical)

  const criticalPresent = criticalChecks.filter(c => c.present).length
  const optionalPresent = optionalChecks.filter(c => c.present).length

  const criticalScore = criticalChecks.length > 0 ? criticalPresent / criticalChecks.length : 1
  const optionalScore = optionalChecks.length > 0 ? optionalPresent / optionalChecks.length : 1

  const score = Math.round(criticalScore * 70 + optionalScore * 30)

  const criticalMissingFields = criticalChecks
    .filter(c => !c.present)
    .map(c => c.field)

  const optionalMissingFields = optionalChecks
    .filter(c => !c.present)
    .map(c => c.field)

  const recommendedDataRequests = checks
    .filter(c => !c.present && c.critical)
    .map(c => `请提供${c.description}（${c.howToObtain}）`)

  const level: DataCompletenessResult['level'] =
    score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low'

  return {
    score,
    level,
    canGeneratePreliminaryReport: score >= 45,
    requiresExpertReview: score < 70 || criticalMissingFields.length > 0,
    criticalMissingFields,
    optionalMissingFields,
    recommendedDataRequests,
  }
}
