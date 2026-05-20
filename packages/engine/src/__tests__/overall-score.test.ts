import { describe, it, expect } from 'vitest'
import { calculateOverallScore, runFullAssessment } from '../overall-score.js'
import type { AssessmentProject, ScoreBreakdown } from '@waps/schemas'

const sampleProject: AssessmentProject = {
  id: 'sg-jkt-001',
  projectName: 'Singapore-Jakarta WAPS Assessment',
  clientName: 'Example Shipping',
  createdAt: '2026-05-20T00:00:00Z',
  updatedAt: '2026-05-20T00:00:00Z',
  vessel: {
    vesselName: 'Example Vessel',
    vesselType: 'general_cargo',
    flag: 'Singapore',
    classSociety: 'DNV',
    yearBuilt: 2015,
    loaM: 120,
    beamM: 20,
    draftM: 7,
    dwtT: 10000,
    grossTonnage: 8000,
    serviceSpeedKn: 12,
    typicalSpeedKn: 10.5,
    mainEnginePowerKw: 4500,
  },
  route: {
    routeName: 'Singapore - Jakarta',
    originPort: 'Singapore',
    destinationPort: 'Jakarta',
    routeDistanceNm: 580,
    voyageCountPerYear: 40,
    averageSpeedOverGroundKn: 10.2,
    seasonalPattern: 'monsoon',
    internationalVoyage: true,
    callsEuPorts: false,
  },
  fuel: {
    fuelType: 'VLSFO',
    annualFuelConsumptionT: 2500,
    fuelPriceUsdPerT: 650,
    annualOperatingDays: 280,
    baselineConfidence: 'medium',
  },
  weather: {
    dataset: 'manual_estimate',
    analysisPeriodYears: 5,
    averageTrueWindSpeedMs: 7.8,
    favorableWindPercentage: 46,
    beamReachPercentage: 28,
    downwindPercentage: 18,
    upwindPercentage: 20,
    seasonalVariability: 'medium',
  },
  deck: {
    availableDeckAreaM2: 80,
    availableDeckLengthM: 20,
    availableDeckWidthM: 6,
    maxAllowableInstallationHeightM: 25,
    cargoOperationConflict: 'medium',
    craneOperationConflict: 'medium',
    bridgeVisibilityImpact: 'medium',
    existingEquipment: ['crane', 'hatch_cover', 'ventilation'],
    generalArrangementAvailable: false,
  },
  stability: {
    gmM: 1.8,
    maxAllowableAdditionalWeightT: 50,
    deckLoadLimitTPerM2: 5,
    stabilityBookletAvailable: false,
    structuralDrawingsAvailable: false,
    incliningTestDataAvailable: false,
  },
  operation: {
    annualOperatingDays: 280,
    portCallFrequencyPerMonth: 6,
    cargoOperationType: 'deck_cargo',
    loadingUnloadingConstraints: ['crane working envelope', 'hatch cover access'],
    crewSkillLevel: 'medium',
    maintenanceCapability: 'medium',
    scheduleSensitivity: 'medium',
    insuranceConcernLevel: 'medium',
    portRestrictionLevel: 'medium',
  },
  policy: {
    imoCiiApplicable: true,
    eexiApplicable: true,
    seempApplicable: true,
    fuelEuApplicable: false,
    euEtsApplicable: false,
    esgReportingRequired: true,
    greenFinanceInterest: true,
    domesticGreenShippingProgram: true,
  },
}

describe('calculateOverallScore', () => {
  it('score 80 → rating B', () => {
    const scores: ScoreBreakdown = {
      vesselSuitability: 80, routeWind: 80, economic: 80,
      shippingOperation: 80, classRisk: 80, stabilityStructure: 80,
      policyCompliance: 80, dataCompleteness: 80,
    }
    const { totalScore, rating } = calculateOverallScore(scores)
    expect(totalScore).toBe(80)
    expect(rating).toBe('B')
  })

  it('score 90 → rating A', () => {
    const scores: ScoreBreakdown = {
      vesselSuitability: 90, routeWind: 90, economic: 90,
      shippingOperation: 90, classRisk: 90, stabilityStructure: 90,
      policyCompliance: 90, dataCompleteness: 90,
    }
    const { totalScore, rating, recommendation } = calculateOverallScore(scores)
    expect(totalScore).toBe(90)
    expect(rating).toBe('A')
    expect(recommendation).toBe('proceed_to_detailed_design')
  })

  it('score 45 → rating D', () => {
    const scores: ScoreBreakdown = {
      vesselSuitability: 45, routeWind: 45, economic: 45,
      shippingOperation: 45, classRisk: 45, stabilityStructure: 45,
      policyCompliance: 45, dataCompleteness: 45,
    }
    const { rating, recommendation } = calculateOverallScore(scores)
    expect(rating).toBe('D')
    expect(recommendation).toBe('research_only')
  })
})

describe('runFullAssessment', () => {
  it('runs without error on sample project', () => {
    expect(() => runFullAssessment(sampleProject)).not.toThrow()
  })

  it('returns valid structure', () => {
    const result = runFullAssessment(sampleProject)
    expect(result.projectId).toBe('sg-jkt-001')
    expect(result.totalScore).toBeGreaterThan(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
    expect(['A', 'B', 'C', 'D', 'E']).toContain(result.rating)
    expect(result.fuelSaving.baseFuelSavingT).toBeGreaterThan(0)
    expect(result.economics.capexBaseUsd).toBeGreaterThan(0)
    expect(result.risks.length).toBeGreaterThanOrEqual(0)
    expect(result.nextActions.length).toBeGreaterThan(0)
  })

  it('fuel saving is positive when annual consumption provided', () => {
    const result = runFullAssessment(sampleProject)
    expect(result.fuelSaving.baseFuelSavingT).toBeGreaterThan(0)
    expect(result.co2Reduction.baseCo2ReductionT).toBeGreaterThan(0)
  })

  it('generatedAt is a valid ISO date string', () => {
    const result = runFullAssessment(sampleProject)
    expect(() => new Date(result.generatedAt)).not.toThrow()
  })
})
