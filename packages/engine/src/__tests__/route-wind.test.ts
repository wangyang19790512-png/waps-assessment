import { describe, it, expect } from 'vitest'
import { assessRouteWind, calcEffectiveWindUtilizationRatio } from '../route-wind.js'
import type { WeatherProfile, RouteProfile } from '@waps/schemas'

const goodWeather: WeatherProfile = {
  averageTrueWindSpeedMs: 8.5,
  favorableWindPercentage: 55,
  beamReachPercentage: 30,
  seasonalVariability: 'low',
}

const route: RouteProfile = { routeDistanceNm: 580, seasonalPattern: 'monsoon' }

describe('assessRouteWind', () => {
  it('good wind data produces high score and highly_suitable recommendation', () => {
    const result = assessRouteWind(goodWeather, route)
    expect(result.score).toBeGreaterThanOrEqual(65)
    expect(result.routeRecommendation).toBe('highly_suitable')
    expect(result.effectiveWindUtilizationRatio).toBeGreaterThan(0)
  })

  it('no weather data returns insufficient_data recommendation', () => {
    const result = assessRouteWind(undefined, route)
    expect(result.routeRecommendation).toBe('insufficient_data')
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  it('low wind speed returns low score and marginal/not_suitable', () => {
    const weakWind: WeatherProfile = { averageTrueWindSpeedMs: 2.5, favorableWindPercentage: 15, seasonalVariability: 'high' }
    const result = assessRouteWind(weakWind, route)
    expect(result.score).toBeLessThan(40)
    expect(['marginal', 'not_suitable']).toContain(result.routeRecommendation)
  })

  it('effectiveWindUtilizationRatio is between 0 and 0.75', () => {
    const ratio = calcEffectiveWindUtilizationRatio(goodWeather)
    expect(ratio).toBeGreaterThan(0)
    expect(ratio).toBeLessThanOrEqual(0.75)
  })

  it('monsoon route has bestSeason and worstSeason', () => {
    const result = assessRouteWind(goodWeather, route)
    expect(result.bestSeason).toBeDefined()
    expect(result.worstSeason).toBeDefined()
  })
})
