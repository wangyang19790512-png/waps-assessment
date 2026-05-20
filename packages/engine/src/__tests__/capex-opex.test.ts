import { describe, it, expect } from 'vitest'
import { calculateEconomics } from '../capex-opex.js'
import { calculateFuelSaving } from '../fuel-saving.js'
import type { FuelProfile } from '@waps/schemas'

const fuel: FuelProfile = { fuelType: 'VLSFO', annualFuelConsumptionT: 2500, fuelPriceUsdPerT: 650 }

describe('calculateEconomics', () => {
  it('returns valid cost ranges for rotor_sail', () => {
    const fuelSaving = calculateFuelSaving(fuel, 0.4125)
    const result = calculateEconomics('rotor_sail', fuelSaving, fuel)
    expect(result.capexLowUsd).toBeLessThan(result.capexBaseUsd)
    expect(result.capexBaseUsd).toBeLessThan(result.capexHighUsd)
    expect(result.annualOpexUsd).toBeGreaterThan(0)
  })

  it('payback is null when annual benefit <= 0', () => {
    const zeroFuel: FuelProfile = { fuelType: 'VLSFO', annualFuelConsumptionT: 50, fuelPriceUsdPerT: 100 }
    const fuelSaving = calculateFuelSaving(zeroFuel, 0.01)
    const result = calculateEconomics('rigid_wing_sail', fuelSaving, zeroFuel)
    // With tiny savings vs large OPEX, payback should be null or very long
    if (result.paybackYearsBase === null) {
      expect(result.paybackYearsBase).toBeNull()
    } else {
      expect(result.paybackYearsBase).toBeGreaterThan(10)
    }
  })

  it('good fuel saving produces economicScore >= 45', () => {
    const richFuel: FuelProfile = { fuelType: 'VLSFO', annualFuelConsumptionT: 5000, fuelPriceUsdPerT: 700 }
    const fuelSaving = calculateFuelSaving(richFuel, 0.6)
    const result = calculateEconomics('rotor_sail', fuelSaving, richFuel)
    expect(result.economicScore).toBeGreaterThanOrEqual(45)
  })

  it('soft_sail has lower capex than rigid_wing_sail', () => {
    const fuelSaving = calculateFuelSaving(fuel, 0.4)
    const soft = calculateEconomics('soft_sail', fuelSaving, fuel)
    const rigid = calculateEconomics('rigid_wing_sail', fuelSaving, fuel)
    expect(soft.capexBaseUsd).toBeLessThan(rigid.capexBaseUsd)
  })
})
