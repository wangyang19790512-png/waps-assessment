import { describe, it, expect } from 'vitest'
import { assessDataCompleteness } from '../data-completeness.js'
import type { AssessmentProject } from '@waps/schemas'

const base: AssessmentProject = {
  id: 'test-1',
  projectName: 'Test',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  vessel: { vesselType: 'bulk_carrier', loaM: 120, beamM: 20, serviceSpeedKn: 12 },
  route: { routeDistanceNm: 500, voyageCountPerYear: 40 },
  fuel: { fuelType: 'VLSFO', annualFuelConsumptionT: 2500, fuelPriceUsdPerT: 650 },
  weather: { averageTrueWindSpeedMs: 7.8, favorableWindPercentage: 46 },
  deck: { availableDeckAreaM2: 80, cargoOperationConflict: 'medium' },
  stability: { gmM: 1.8, maxAllowableAdditionalWeightT: 50, stabilityBookletAvailable: true, structuralDrawingsAvailable: true },
  operation: { annualOperatingDays: 280, crewSkillLevel: 'medium' },
  policy: { imoCiiApplicable: true, eexiApplicable: true },
}

describe('assessDataCompleteness', () => {
  it('returns high level when all critical fields provided', () => {
    const result = assessDataCompleteness(base)
    expect(result.level).toBe('high')
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.canGeneratePreliminaryReport).toBe(true)
    expect(result.criticalMissingFields).toHaveLength(0)
  })

  it('returns medium/low when critical fuel/route/weather data missing', () => {
    const sparse: AssessmentProject = {
      ...base,
      fuel: { fuelType: 'VLSFO' },
      route: {},
      weather: undefined,
    }
    const result = assessDataCompleteness(sparse)
    expect(['low', 'medium']).toContain(result.level)
    expect(result.criticalMissingFields.length).toBeGreaterThan(0)
    expect(result.recommendedDataRequests.length).toBeGreaterThan(0)
  })

  it('returns low when nearly all data missing', () => {
    const empty: AssessmentProject = {
      ...base,
      fuel: { fuelType: 'VLSFO' },
      route: {},
      weather: undefined,
      deck: {},
      stability: undefined,
      operation: {},
      policy: {},
    }
    const result = assessDataCompleteness(empty)
    expect(result.level).toBe('low')
    expect(result.criticalMissingFields.length).toBeGreaterThan(3)
  })

  it('canGeneratePreliminaryReport is false when score < 45', () => {
    const minimal: AssessmentProject = {
      ...base,
      fuel: { fuelType: 'VLSFO' },
      route: {},
      weather: undefined,
      deck: {},
      stability: undefined,
    }
    const result = assessDataCompleteness(minimal)
    if (result.score < 45) {
      expect(result.canGeneratePreliminaryReport).toBe(false)
    }
  })
})
