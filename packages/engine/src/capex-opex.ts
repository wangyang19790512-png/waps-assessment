import type {
  WapsType,
  FuelSavingResult,
  FuelProfile,
  EconomicResult,
} from '@waps/schemas'

interface WapsCost {
  capexLow: number
  capexBase: number
  capexHigh: number
  annualOpex: number
}

const WAPS_COST_BENCHMARKS: Record<WapsType, WapsCost> = {
  rotor_sail:      { capexLow: 600_000,   capexBase: 1_200_000, capexHigh: 2_200_000, annualOpex: 35_000 },
  rigid_wing_sail: { capexLow: 1_000_000, capexBase: 2_000_000, capexHigh: 3_500_000, annualOpex: 50_000 },
  suction_wing:    { capexLow: 800_000,   capexBase: 1_800_000, capexHigh: 3_000_000, annualOpex: 45_000 },
  soft_sail:       { capexLow: 250_000,   capexBase: 600_000,   capexHigh: 1_200_000, annualOpex: 20_000 },
  kite_system:     { capexLow: 400_000,   capexBase: 900_000,   capexHigh: 1_800_000, annualOpex: 30_000 },
  not_recommended: { capexLow: 500_000,   capexBase: 1_000_000, capexHigh: 2_000_000, annualOpex: 30_000 },
}

function calcPayback(capex: number, annualBenefit: number): number | null {
  if (annualBenefit <= 0) return null
  return Math.round((capex / annualBenefit) * 10) / 10
}

function economicScore(paybackBase: number | null): number {
  if (paybackBase === null) return 15
  if (paybackBase < 3) return 90
  if (paybackBase < 5) return 75
  if (paybackBase < 7) return 60
  if (paybackBase < 10) return 45
  if (paybackBase < 15) return 30
  return 15
}

export function calculateEconomics(
  wapsType: WapsType,
  fuelSaving: FuelSavingResult,
  fuel: FuelProfile,
): EconomicResult {
  const cost = WAPS_COST_BENCHMARKS[wapsType]
  const fuelPrice = fuel.fuelPriceUsdPerT ?? 650

  const savingConservative = fuelSaving.conservativeFuelSavingT * fuelPrice
  const savingBase = fuelSaving.baseFuelSavingT * fuelPrice
  const savingOptimistic = fuelSaving.optimisticFuelSavingT * fuelPrice

  const netConservative = savingConservative - cost.annualOpex
  const netBase = savingBase - cost.annualOpex
  const netOptimistic = savingOptimistic - cost.annualOpex

  const paybackBase = calcPayback(cost.capexBase, netBase)

  return {
    capexLowUsd: cost.capexLow,
    capexBaseUsd: cost.capexBase,
    capexHighUsd: cost.capexHigh,
    annualOpexUsd: cost.annualOpex,
    annualFuelCostSavingConservativeUsd: Math.round(savingConservative),
    annualFuelCostSavingBaseUsd: Math.round(savingBase),
    annualFuelCostSavingOptimisticUsd: Math.round(savingOptimistic),
    paybackYearsConservative: calcPayback(cost.capexHigh, netConservative),
    paybackYearsBase: paybackBase,
    paybackYearsOptimistic: calcPayback(cost.capexLow, netOptimistic),
    economicScore: economicScore(paybackBase),
    sensitivityNotes: [
      `燃油价格每波动 $100/t，年收益变化约 $${Math.round(fuelSaving.baseFuelSavingT * 100).toLocaleString()}`,
      'CAPEX 区间较大，建议取得供应商正式报价后更新',
      '若 CII 等政策产生额外经济价值，实际回收期将缩短',
      ...(!fuel.annualFuelConsumptionT ? ['燃油基线数据缺失，经济测算结果不可靠，需补充实际油耗数据'] : []),
    ],
  }
}
