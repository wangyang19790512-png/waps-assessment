import { describe, it, expect } from 'vitest'
import { assessVesselSuitability } from '../vessel-suitability.js'
import type { VesselProfile, DeckProfile, StabilityProfile, OperationProfile } from '@waps/schemas'

describe('assessVesselSuitability', () => {
  it('bulk carrier with ideal params scores high (>=70)', () => {
    const vessel: VesselProfile = { vesselType: 'bulk_carrier', loaM: 150, beamM: 25, serviceSpeedKn: 11, yearBuilt: 2018 }
    const deck: DeckProfile = { availableDeckAreaM2: 160, cargoOperationConflict: 'low', craneOperationConflict: 'low', bridgeVisibilityImpact: 'low' }
    const stability: StabilityProfile = { gmM: 2.2, maxAllowableAdditionalWeightT: 80, stabilityBookletAvailable: true, structuralDrawingsAvailable: true }
    const op: OperationProfile = { annualOperatingDays: 300 }

    const result = assessVesselSuitability(vessel, deck, stability, op)
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.level).toBe('high')
    expect(result.positiveFactors.length).toBeGreaterThan(0)
    expect(result.redFlags).toHaveLength(0)
  })

  it('fast container ship scores lower due to speed', () => {
    const vessel: VesselProfile = { vesselType: 'container', loaM: 200, beamM: 32, serviceSpeedKn: 22, yearBuilt: 2010 }
    const deck: DeckProfile = { cargoOperationConflict: 'high', craneOperationConflict: 'high' }
    const op: OperationProfile = { annualOperatingDays: 260 }

    const result = assessVesselSuitability(vessel, deck, undefined, op)
    expect(result.score).toBeLessThan(60)
    expect(result.redFlags.length).toBeGreaterThan(0)
  })

  it('very old vessel with low GM gets red flags', () => {
    const vessel: VesselProfile = { vesselType: 'general_cargo', loaM: 100, beamM: 18, serviceSpeedKn: 10, yearBuilt: 1992 }
    const deck: DeckProfile = { availableDeckAreaM2: 60 }
    const stability: StabilityProfile = { gmM: 0.7 }
    const op: OperationProfile = {}

    const result = assessVesselSuitability(vessel, deck, stability, op)
    expect(result.redFlags.length).toBeGreaterThan(0)
    expect(result.requiresNavalArchitectReview).toBe(true)
  })

  it('score is always 0-100', () => {
    const vessel: VesselProfile = { vesselType: 'port_service', loaM: 30, beamM: 8, serviceSpeedKn: 25, yearBuilt: 1985 }
    const deck: DeckProfile = { availableDeckAreaM2: 10, cargoOperationConflict: 'high', craneOperationConflict: 'high', bridgeVisibilityImpact: 'high' }
    const op: OperationProfile = { annualOperatingDays: 100 }
    const result = assessVesselSuitability(vessel, deck, undefined, op)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
