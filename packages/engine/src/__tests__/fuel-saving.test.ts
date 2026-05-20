import { describe, it, expect } from 'vitest'
import { calculateFuelSaving, calculateCo2Reduction, DEFAULT_EMISSION_FACTORS } from '../fuel-saving.js'
import type { FuelProfile } from '@waps/schemas'

const fuel: FuelProfile = { fuelType: 'VLSFO', annualFuelConsumptionT: 2500, fuelPriceUsdPerT: 650 }

describe('calculateFuelSaving', () => {
  it('base fuel saving is between conservative and optimistic', () => {
    const result = calculateFuelSaving(fuel, 0.4125)
    expect(result.baseFuelSavingT).toBeGreaterThan(result.conservativeFuelSavingT)
    expect(result.optimisticFuelSavingT).toBeGreaterThan(result.baseFuelSavingT)
  })

  it('rates are between 0 and 1', () => {
    const result = calculateFuelSaving(fuel, 0.4125)
    expect(result.conservativeRate).toBeGreaterThan(0)
    expect(result.optimisticRate).toBeLessThan(1)
  })

  it('zero wind utilization yields zero savings', () => {
    const result = calculateFuelSaving(fuel, 0)
    expect(result.baseFuelSavingT).toBe(0)
    expect(result.conservativeFuelSavingT).toBe(0)
  })

  it('provides assumptions and uncertainty factors', () => {
    const result = calculateFuelSaving(fuel, 0.4125)
    expect(result.assumptions.length).toBeGreaterThan(0)
    expect(result.uncertaintyFactors.length).toBeGreaterThan(0)
  })

  it('known arithmetic: 2500t × 0.4125 windUtil × 0.10 × 0.90 × 0.85 = 78.5t base', () => {
    const result = calculateFuelSaving(fuel, 0.4125)
    const expected = Math.round(2500 * 0.4125 * 0.10 * 0.90 * 0.85)
    expect(result.baseFuelSavingT).toBe(expected)
  })
})

describe('calculateCo2Reduction', () => {
  it('uses correct emission factor for VLSFO', () => {
    const fuelSaving = calculateFuelSaving(fuel, 0.4125)
    const co2 = calculateCo2Reduction(fuelSaving, 'VLSFO')
    expect(co2.emissionFactorUsed).toBe(DEFAULT_EMISSION_FACTORS['VLSFO'])
    expect(co2.baseCo2ReductionT).toBe(Math.round(fuelSaving.baseFuelSavingT * DEFAULT_EMISSION_FACTORS['VLSFO']))
  })

  it('optimistic CO2 > base CO2 > conservative CO2', () => {
    const fuelSaving = calculateFuelSaving(fuel, 0.4125)
    const co2 = calculateCo2Reduction(fuelSaving, 'VLSFO')
    expect(co2.optimisticCo2ReductionT).toBeGreaterThan(co2.baseCo2ReductionT)
    expect(co2.baseCo2ReductionT).toBeGreaterThan(co2.conservativeCo2ReductionT)
  })
})
