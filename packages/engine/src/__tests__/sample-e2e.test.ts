import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { runFullAssessment } from '../overall-score.js'
import type { AssessmentProject } from '@waps/schemas'

const samplePath = join(process.cwd(), 'data/samples/singapore-jakarta.json')
const sampleProject: AssessmentProject = JSON.parse(readFileSync(samplePath, 'utf-8'))

describe('Singapore-Jakarta sample assessment (E2E)', () => {
  const result = runFullAssessment(sampleProject)

  it('score is in valid range', () => {
    expect(result.totalScore).toBeGreaterThan(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
  })

  it('rating and recommendation are consistent', () => {
    const ratingMap = { A: 'proceed_to_detailed_design', B: 'proceed_with_data_collection' }
    if (result.rating === 'A' || result.rating === 'B') {
      expect(result.recommendation).toBe(ratingMap[result.rating])
    }
    console.log('\n=== Sample Assessment Result ===')
    console.log(`Total Score: ${result.totalScore} | Rating: ${result.rating}`)
    console.log(`Recommendation: ${result.recommendation}`)
    console.log(`Recommended WAPS: ${result.recommendedWapsType}`)
    console.log(`Fuel Saving (base): ${result.fuelSaving.baseFuelSavingT} t/yr  (${(result.fuelSaving.baseRate * 100).toFixed(1)}%)`)
    console.log(`CO2 Reduction (base): ${result.co2Reduction.baseCo2ReductionT} t/yr`)
    console.log(`CAPEX (base): $${result.economics.capexBaseUsd.toLocaleString()}`)
    console.log(`Payback (base): ${result.economics.paybackYearsBase} yr`)
    console.log('Score Breakdown:', result.scores)
  })

  it('fuel saving is positive', () => {
    expect(result.fuelSaving.baseFuelSavingT).toBeGreaterThan(0)
    expect(result.co2Reduction.baseCo2ReductionT).toBeGreaterThan(0)
  })

  it('has next actions', () => {
    expect(result.nextActions.length).toBeGreaterThan(0)
  })

  it('missing stability docs flagged in data gaps', () => {
    const hasStabilityGap = result.dataGaps.some(g =>
      g.field.includes('stability') || g.field.includes('structural')
    )
    // Either in gaps or in class risk concerns
    const hasInClassRisk = result.classRisk.keyClassConcerns.some(c => c.includes('稳性'))
    expect(hasStabilityGap || hasInClassRisk).toBe(true)
  })
})
