import type {
  WeatherProfile,
  RouteProfile,
  RouteWindResult,
} from '@waps/schemas'

function windSpeedPoints(ms: number | undefined): number {
  if (ms === undefined) return 15
  if (ms >= 9) return 35
  if (ms >= 7) return 27
  if (ms >= 5) return 17
  if (ms >= 3) return 8
  return 2
}

function favorableWindPoints(pct: number | undefined): number {
  if (pct === undefined) return 15
  if (pct >= 65) return 35
  if (pct >= 50) return 27
  if (pct >= 35) return 19
  if (pct >= 20) return 11
  return 4
}

function seasonalityPoints(v: WeatherProfile['seasonalVariability']): number {
  if (!v || v === 'unknown') return 10
  if (v === 'low') return 20
  if (v === 'medium') return 14
  return 8
}

function beamReachPoints(pct: number | undefined): number {
  if (pct === undefined) return 5
  if (pct >= 40) return 10
  if (pct >= 25) return 8
  if (pct >= 15) return 5
  return 2
}

export function calcEffectiveWindUtilizationRatio(weather: WeatherProfile | undefined): number {
  const favPct = weather?.favorableWindPercentage ?? 50
  return Math.min(favPct / 100, 1.0) * 0.75
}

export function assessRouteWind(
  weather: WeatherProfile | undefined,
  route: RouteProfile,
): RouteWindResult {
  const score = Math.min(
    100,
    windSpeedPoints(weather?.averageTrueWindSpeedMs) +
    favorableWindPoints(weather?.favorableWindPercentage) +
    seasonalityPoints(weather?.seasonalVariability) +
    beamReachPoints(weather?.beamReachPercentage),
  )

  const effectiveWindUtilizationRatio = calcEffectiveWindUtilizationRatio(weather)

  const seasonalVariability: RouteWindResult['seasonalVariability'] =
    weather?.seasonalVariability ?? 'unknown'

  let routeRecommendation: RouteWindResult['routeRecommendation']
  if (!weather?.averageTrueWindSpeedMs) {
    routeRecommendation = 'insufficient_data'
  } else if (score >= 75) {
    routeRecommendation = 'highly_suitable'
  } else if (score >= 55) {
    routeRecommendation = 'suitable_with_seasonal_variation'
  } else if (score >= 35) {
    routeRecommendation = 'marginal'
  } else {
    routeRecommendation = 'not_suitable'
  }

  let bestSeason: string | undefined
  let worstSeason: string | undefined
  if (route.seasonalPattern === 'monsoon') {
    bestSeason = '季风季节（东北季风 / 西南季风高峰期）'
    worstSeason = '季风转换期'
  }

  return {
    score,
    averageTrueWindSpeedMs: weather?.averageTrueWindSpeedMs,
    favorableWindPercentage: weather?.favorableWindPercentage,
    effectiveWindUtilizationRatio,
    seasonalVariability,
    bestSeason,
    worstSeason,
    routeRecommendation,
  }
}
