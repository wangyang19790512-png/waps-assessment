import { describe, it, expect } from 'vitest'
import { assessClassRisk } from '../class-risk.js'
import type { VesselProfile, StabilityProfile, DeckProfile } from '@waps/schemas'

const goodVessel: VesselProfile = { vesselType: 'bulk_carrier', loaM: 150, beamM: 25, serviceSpeedKn: 11, classSociety: 'DNV' }

describe('assessClassRisk', () => {
  it('well-documented vessel with good stability is low complexity', () => {
    const stability: StabilityProfile = {
      gmM: 2.1, maxAllowableAdditionalWeightT: 80,
      stabilityBookletAvailable: true, structuralDrawingsAvailable: true, incliningTestDataAvailable: true,
    }
    const deck: DeckProfile = { generalArrangementAvailable: true }
    const result = assessClassRisk(goodVessel, stability, deck, 'rotor_sail')
    expect(result.approvalComplexity).toBe('low')
    expect(result.score).toBeGreaterThanOrEqual(75)
  })

  it('missing all docs is high complexity', () => {
    const stability: StabilityProfile = { stabilityBookletAvailable: false, structuralDrawingsAvailable: false }
    const deck: DeckProfile = { generalArrangementAvailable: false }
    const result = assessClassRisk(goodVessel, stability, deck, 'rigid_wing_sail')
    expect(['medium_high', 'high']).toContain(result.approvalComplexity)
    expect(result.keyClassConcerns.length).toBeGreaterThan(0)
  })

  it('rigid_wing_sail requires FMEA', () => {
    const result = assessClassRisk(goodVessel, undefined, {}, 'rigid_wing_sail')
    expect(result.requiresFmea).toBe(true)
  })

  it('always includes standard documents', () => {
    const result = assessClassRisk(goodVessel, undefined, {}, 'rotor_sail')
    expect(result.likelyRequiredDocuments.length).toBeGreaterThan(3)
    expect(result.requiresSeaTrialPlan).toBe(true)
  })
})
