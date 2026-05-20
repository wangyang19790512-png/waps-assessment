import { describe, it, expect } from 'vitest'
import { assessShippingOperation } from '../shipping-operation.js'
import type { OperationProfile, DeckProfile } from '@waps/schemas'

describe('assessShippingOperation', () => {
  it('low-conflict scenario scores >= 80', () => {
    const op: OperationProfile = {
      crewSkillLevel: 'high', maintenanceCapability: 'high',
      scheduleSensitivity: 'low', insuranceConcernLevel: 'low', portRestrictionLevel: 'low',
    }
    const deck: DeckProfile = {
      cargoOperationConflict: 'none', craneOperationConflict: 'none', bridgeVisibilityImpact: 'none',
    }
    const result = assessShippingOperation(op, deck)
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.impactLevel).toBe('low')
    expect(result.operationalRedFlags).toHaveLength(0)
  })

  it('high-conflict scenario scores <= 50 and has red flags', () => {
    const op: OperationProfile = {
      crewSkillLevel: 'low', scheduleSensitivity: 'high',
      insuranceConcernLevel: 'high', portRestrictionLevel: 'high',
    }
    const deck: DeckProfile = {
      cargoOperationConflict: 'high', craneOperationConflict: 'high', bridgeVisibilityImpact: 'high',
    }
    const result = assessShippingOperation(op, deck)
    expect(result.score).toBeLessThanOrEqual(50)
    expect(result.majorConflicts.length).toBeGreaterThan(0)
    expect(result.operationalRedFlags.length).toBeGreaterThan(0)
    expect(result.insuranceReviewRequired).toBe(true)
  })

  it('score is always 0-100', () => {
    const op: OperationProfile = {}
    const deck: DeckProfile = {}
    const result = assessShippingOperation(op, deck)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
