import { describe, it, expect } from 'vitest'
import { assessStabilityStructure } from '../stability-structure.js'
import type { StabilityProfile, DeckProfile } from '@waps/schemas'

describe('assessStabilityStructure', () => {
  it('full data with good GM scores high', () => {
    const stability: StabilityProfile = {
      gmM: 2.2, maxAllowableAdditionalWeightT: 80, deckLoadLimitTPerM2: 5,
      stabilityBookletAvailable: true, structuralDrawingsAvailable: true, incliningTestDataAvailable: true,
    }
    const result = assessStabilityStructure(stability, {})
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.stabilityRiskLevel).toBe('low')
    expect(result.missingCriticalData).toHaveLength(0)
  })

  it('missing all documents returns high/unknown risk level', () => {
    const result = assessStabilityStructure(undefined, {})
    expect(['unknown', 'medium', 'high']).toContain(result.stabilityRiskLevel)
    expect(result.missingCriticalData.length).toBeGreaterThan(0)
    expect(result.requiresNavalArchitectReview).toBe(true)
  })

  it('low GM raises stability risk to high', () => {
    const stability: StabilityProfile = {
      gmM: 0.7, stabilityBookletAvailable: false, structuralDrawingsAvailable: false,
    }
    const result = assessStabilityStructure(stability, {})
    expect(result.stabilityRiskLevel).toBe('high')
    expect(result.keyRisks.length).toBeGreaterThan(0)
  })
})
