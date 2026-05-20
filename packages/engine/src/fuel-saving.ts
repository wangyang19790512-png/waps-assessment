import type {
  FuelProfile,
  AssessmentAssumptions,
  FuelSavingResult,
  Co2ReductionResult,
} from '@waps/schemas'

export const DEFAULT_EMISSION_FACTORS: Record<string, number> = {
  VLSFO: 3.114,
  HFO: 3.114,
  MGO: 3.206,
  LNG: 2.750,
  methanol: 1.375,
  ammonia: 0,
  other: 3.114,
}

const DEFAULT_ASSUMPTIONS: Required<AssessmentAssumptions> = {
  effectiveWindUtilizationRatio: 0.375, // fallback if no wind data
  propulsiveContributionConservative: 0.06,
  propulsiveContributionBase: 0.10,
  propulsiveContributionOptimistic: 0.18,
  operationalAvailability: 0.90,
  controlEfficiencyFactor: 0.85,
}

export function calculateFuelSaving(
  fuel: FuelProfile,
  effectiveWindUtilizationRatio: number,
  assumptions?: AssessmentAssumptions,
): FuelSavingResult {
  const a = { ...DEFAULT_ASSUMPTIONS, ...assumptions, effectiveWindUtilizationRatio }

  const annualFuel = fuel.annualFuelConsumptionT ?? 0

  const conservativeRate = a.effectiveWindUtilizationRatio * a.propulsiveContributionConservative * a.operationalAvailability * a.controlEfficiencyFactor
  const baseRate = a.effectiveWindUtilizationRatio * a.propulsiveContributionBase * a.operationalAvailability * a.controlEfficiencyFactor
  const optimisticRate = a.effectiveWindUtilizationRatio * a.propulsiveContributionOptimistic * a.operationalAvailability * a.controlEfficiencyFactor

  return {
    conservativeRate: Math.round(conservativeRate * 10000) / 10000,
    baseRate: Math.round(baseRate * 10000) / 10000,
    optimisticRate: Math.round(optimisticRate * 10000) / 10000,
    conservativeFuelSavingT: Math.round(annualFuel * conservativeRate),
    baseFuelSavingT: Math.round(annualFuel * baseRate),
    optimisticFuelSavingT: Math.round(annualFuel * optimisticRate),
    assumptions: [
      `有效风能利用率：${(a.effectiveWindUtilizationRatio * 100).toFixed(1)}%`,
      `推进贡献系数（保守/中性/乐观）：${(a.propulsiveContributionConservative * 100).toFixed(0)}% / ${(a.propulsiveContributionBase * 100).toFixed(0)}% / ${(a.propulsiveContributionOptimistic * 100).toFixed(0)}%`,
      `系统可用率：${(a.operationalAvailability * 100).toFixed(0)}%`,
      `控制效率因子：${(a.controlEfficiencyFactor * 100).toFixed(0)}%`,
    ],
    uncertaintyFactors: [
      '实际节油率取决于真实气象条件与航线风向分布',
      '推进贡献系数在详细 VPP 计算前属于区间估算',
      '系统实际可用率受维护周期和故障率影响',
      fuel.baselineConfidence === 'low' ? '燃油基线数据置信度低，节油量估算存在较大不确定性' : '建议以中性情景作为规划基准',
    ].filter(Boolean),
  }
}

export function calculateCo2Reduction(
  fuelSaving: FuelSavingResult,
  fuelType: FuelProfile['fuelType'],
): Co2ReductionResult {
  const ef = DEFAULT_EMISSION_FACTORS[fuelType] ?? DEFAULT_EMISSION_FACTORS.other

  return {
    conservativeCo2ReductionT: Math.round(fuelSaving.conservativeFuelSavingT * ef),
    baseCo2ReductionT: Math.round(fuelSaving.baseFuelSavingT * ef),
    optimisticCo2ReductionT: Math.round(fuelSaving.optimisticFuelSavingT * ef),
    emissionFactorUsed: ef,
    notes: [
      `使用 IMO 排放因子：${ef} tCO₂/t 燃油（${fuelType}）`,
      'CO₂ 减排量为直接燃烧排放，未包含生命周期排放',
      '可用于 CII 评级改善和 ESG 报告',
    ],
  }
}
