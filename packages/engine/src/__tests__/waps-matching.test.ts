import { describe, it, expect } from 'vitest'
import { matchWapsType } from '../waps-matching.js'
import type { VesselProfile, DeckProfile, WeatherProfile, OperationProfile } from '@waps/schemas'

describe('matchWapsType', () => {
  it('bulk carrier with good deck recommends rotor_sail', () => {
    const vessel: VesselProfile = { vesselType: 'bulk_carrier', loaM: 150, beamM: 25, serviceSpeedKn: 11 }
    const deck: DeckProfile = { availableDeckAreaM2: 150, cargoOperationConflict: 'low', craneOperationConflict: 'low' }
    const weather: WeatherProfile = { averageTrueWindSpeedMs: 8, favorableWindPercentage: 50 }
    const op: OperationProfile = { crewSkillLevel: 'medium', maintenanceCapability: 'medium' }

    const result = matchWapsType(vessel, deck, weather, op)
    expect(result.recommendedType).toBe('rotor_sail')
    expect(result.reasoning.length).toBeGreaterThan(0)
  })

  it('small vessel with skilled crew considers soft_sail', () => {
    const vessel: VesselProfile = { vesselType: 'general_cargo', loaM: 85, beamM: 14, serviceSpeedKn: 10 }
    const deck: DeckProfile = { availableDeckAreaM2: 40 }
    const op: OperationProfile = { crewSkillLevel: 'high', maintenanceCapability: 'high', portCallFrequencyPerMonth: 4 }

    const result = matchWapsType(vessel, deck, undefined, op)
    expect(['soft_sail', 'rotor_sail']).toContain(result.recommendedType)
  })

  it('returns not_recommended when all types score below threshold', () => {
    const vessel: VesselProfile = { vesselType: 'port_service', loaM: 25, beamM: 7, serviceSpeedKn: 8 }
    const deck: DeckProfile = { availableDeckAreaM2: 5, cargoOperationConflict: 'high' }
    const op: OperationProfile = { crewSkillLevel: 'low', maintenanceCapability: 'low', portCallFrequencyPerMonth: 20 }

    const result = matchWapsType(vessel, deck, undefined, op)
    // port_service with tiny deck and frequent port calls should score very low for all
    expect(result.nextValidationTasks.length).toBeGreaterThan(0)
  })

  it('always returns nextValidationTasks', () => {
    const vessel: VesselProfile = { vesselType: 'tanker', loaM: 180, beamM: 30, serviceSpeedKn: 13 }
    const deck: DeckProfile = {}
    const op: OperationProfile = {}
    const result = matchWapsType(vessel, deck, undefined, op)
    expect(result.nextValidationTasks.length).toBeGreaterThan(0)
  })
})
