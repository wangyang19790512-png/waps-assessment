import { describe, it, expect } from 'vitest'
import { assessPolicyCompliance } from '../policy-compliance.js'
import type { PolicyProfile, RouteProfile } from '@waps/schemas'

describe('assessPolicyCompliance', () => {
  it('EU-calling vessel with full policy scores high', () => {
    const policy: PolicyProfile = {
      imoCiiApplicable: true, eexiApplicable: true,
      fuelEuApplicable: true, euEtsApplicable: true,
      esgReportingRequired: true, greenFinanceInterest: true,
      domesticGreenShippingProgram: true,
    }
    const route: RouteProfile = { callsEuPorts: true }
    const result = assessPolicyCompliance(policy, route)
    expect(result.score).toBeGreaterThan(60)
    expect(result.applicablePolicies.length).toBeGreaterThan(4)
    expect(result.fuelEuBenefit).toBe('high')
    expect(result.euEtsBenefit).toBe('high')
  })

  it('domestic-only vessel without EU policies scores lower', () => {
    const policy: PolicyProfile = {
      imoCiiApplicable: false, eexiApplicable: false,
      fuelEuApplicable: false, euEtsApplicable: false,
      esgReportingRequired: false, domesticGreenShippingProgram: true,
    }
    const route: RouteProfile = { callsEuPorts: false }
    const result = assessPolicyCompliance(policy, route)
    expect(result.score).toBeLessThan(40)
    expect(result.fuelEuBenefit).toBe('not_applicable')
  })

  it('always includes uncertainty and disclaimer notes', () => {
    const policy: PolicyProfile = {}
    const route: RouteProfile = {}
    const result = assessPolicyCompliance(policy, route)
    expect(result.policyUncertainties.length).toBeGreaterThan(0)
    expect(result.notes.length).toBeGreaterThan(0)
  })

  it('score is always 0-100', () => {
    const policy: PolicyProfile = {
      imoCiiApplicable: true, eexiApplicable: true,
      fuelEuApplicable: true, euEtsApplicable: true,
      esgReportingRequired: true, greenFinanceInterest: true,
      domesticGreenShippingProgram: true,
    }
    const result = assessPolicyCompliance(policy, { callsEuPorts: true })
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })
})
