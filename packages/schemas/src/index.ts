// ─── Input Profiles ──────────────────────────────────────────────────────────

export interface AssessmentProject {
  id: string
  projectName: string
  clientName?: string
  createdAt: string
  updatedAt: string
  vessel: VesselProfile
  route: RouteProfile
  fuel: FuelProfile
  weather?: WeatherProfile
  deck: DeckProfile
  stability?: StabilityProfile
  operation: OperationProfile
  policy: PolicyProfile
  assumptions?: AssessmentAssumptions
}

export interface VesselProfile {
  vesselName?: string
  imoNumber?: string
  vesselType:
    | 'bulk_carrier'
    | 'tanker'
    | 'container'
    | 'general_cargo'
    | 'offshore_support'
    | 'research'
    | 'training'
    | 'ferry'
    | 'port_service'
    | 'other'
  flag?: string
  classSociety?: 'DNV' | 'ABS' | 'LR' | 'BV' | 'ClassNK' | 'CCS' | 'KR' | 'Other'
  yearBuilt?: number
  loaM: number
  lbpM?: number
  beamM: number
  draftM?: number
  dwtT?: number
  grossTonnage?: number
  displacementT?: number
  serviceSpeedKn: number
  typicalSpeedKn?: number
  mainEnginePowerKw?: number
  auxiliaryEnginePowerKw?: number
}

export interface RouteProfile {
  routeName?: string
  originPort?: string
  destinationPort?: string
  routeDistanceNm?: number
  voyageCountPerYear?: number
  averageSpeedOverGroundKn?: number
  waypoints?: Waypoint[]
  historicalAisFileName?: string
  seasonalPattern?: 'monsoon' | 'non_monsoon' | 'mixed' | 'unknown'
  internationalVoyage?: boolean
  callsEuPorts?: boolean
}

export interface Waypoint {
  lat: number
  lon: number
  timestamp?: string
  sogKn?: number
  cogDeg?: number
}

export interface FuelProfile {
  fuelType: 'VLSFO' | 'HFO' | 'MGO' | 'LNG' | 'methanol' | 'ammonia' | 'other'
  annualFuelConsumptionT?: number
  averageDailyFuelConsumptionT?: number
  fuelPriceUsdPerT?: number
  annualOperatingDays?: number
  baselineConfidence?: 'high' | 'medium' | 'low'
}

export interface WeatherProfile {
  dataset?: 'ERA5' | 'NOAA' | 'commercial' | 'user_uploaded' | 'manual_estimate'
  analysisPeriodYears?: number
  averageTrueWindSpeedMs?: number
  favorableWindPercentage?: number
  beamReachPercentage?: number
  downwindPercentage?: number
  upwindPercentage?: number
  seasonalVariability?: 'low' | 'medium' | 'high' | 'unknown'
}

export interface DeckProfile {
  availableDeckAreaM2?: number
  availableDeckLengthM?: number
  availableDeckWidthM?: number
  maxAllowableInstallationHeightM?: number
  cargoOperationConflict?: 'none' | 'low' | 'medium' | 'high' | 'unknown'
  craneOperationConflict?: 'none' | 'low' | 'medium' | 'high' | 'unknown'
  bridgeVisibilityImpact?: 'none' | 'low' | 'medium' | 'high' | 'unknown'
  existingEquipment?: string[]
  generalArrangementAvailable?: boolean
}

export interface StabilityProfile {
  gmM?: number
  kgM?: number
  vcgM?: number
  lightshipWeightT?: number
  maxAllowableAdditionalWeightT?: number
  deckLoadLimitTPerM2?: number
  stabilityBookletAvailable?: boolean
  structuralDrawingsAvailable?: boolean
  incliningTestDataAvailable?: boolean
}

export interface OperationProfile {
  annualOperatingDays?: number
  portCallFrequencyPerMonth?: number
  cargoOperationType?:
    | 'container'
    | 'bulk'
    | 'liquid'
    | 'deck_cargo'
    | 'offshore'
    | 'research'
    | 'passenger'
    | 'none'
    | 'other'
  loadingUnloadingConstraints?: string[]
  crewSkillLevel?: 'high' | 'medium' | 'low' | 'unknown'
  maintenanceCapability?: 'high' | 'medium' | 'low' | 'unknown'
  scheduleSensitivity?: 'high' | 'medium' | 'low' | 'unknown'
  insuranceConcernLevel?: 'high' | 'medium' | 'low' | 'unknown'
  portRestrictionLevel?: 'high' | 'medium' | 'low' | 'unknown'
}

export interface PolicyProfile {
  imoCiiApplicable?: boolean
  eexiApplicable?: boolean
  seempApplicable?: boolean
  fuelEuApplicable?: boolean
  euEtsApplicable?: boolean
  esgReportingRequired?: boolean
  greenFinanceInterest?: boolean
  domesticGreenShippingProgram?: boolean
}

export interface AssessmentAssumptions {
  effectiveWindUtilizationRatio?: number
  propulsiveContributionConservative?: number
  propulsiveContributionBase?: number
  propulsiveContributionOptimistic?: number
  operationalAvailability?: number
  controlEfficiencyFactor?: number
}

// ─── Result Types ─────────────────────────────────────────────────────────────

export type WapsType =
  | 'rotor_sail'
  | 'rigid_wing_sail'
  | 'suction_wing'
  | 'soft_sail'
  | 'kite_system'
  | 'not_recommended'

export interface DataCompletenessResult {
  score: number
  level: 'high' | 'medium' | 'low'
  canGeneratePreliminaryReport: boolean
  requiresExpertReview: boolean
  criticalMissingFields: string[]
  optionalMissingFields: string[]
  recommendedDataRequests: string[]
}

export interface VesselSuitabilityResult {
  score: number
  level: 'high' | 'medium_high' | 'medium' | 'low' | 'not_recommended'
  positiveFactors: string[]
  constraints: string[]
  redFlags: string[]
  requiresNavalArchitectReview: boolean
}

export interface RouteWindResult {
  score: number
  averageTrueWindSpeedMs?: number
  favorableWindPercentage?: number
  effectiveWindUtilizationRatio: number
  seasonalVariability: 'low' | 'medium' | 'high' | 'unknown'
  bestSeason?: string
  worstSeason?: string
  routeRecommendation:
    | 'highly_suitable'
    | 'suitable_with_seasonal_variation'
    | 'marginal'
    | 'not_suitable'
    | 'insufficient_data'
}

export interface WapsMatchingResult {
  recommendedType: WapsType
  alternativeTypes: WapsType[]
  notRecommendedTypes: WapsType[]
  reasoning: string[]
  technologyRisks: string[]
  nextValidationTasks: string[]
}

export interface FuelSavingResult {
  conservativeRate: number
  baseRate: number
  optimisticRate: number
  conservativeFuelSavingT: number
  baseFuelSavingT: number
  optimisticFuelSavingT: number
  assumptions: string[]
  uncertaintyFactors: string[]
}

export interface Co2ReductionResult {
  conservativeCo2ReductionT: number
  baseCo2ReductionT: number
  optimisticCo2ReductionT: number
  emissionFactorUsed: number
  notes: string[]
}

export interface EconomicResult {
  capexLowUsd: number
  capexBaseUsd: number
  capexHighUsd: number
  annualOpexUsd: number
  annualFuelCostSavingConservativeUsd: number
  annualFuelCostSavingBaseUsd: number
  annualFuelCostSavingOptimisticUsd: number
  paybackYearsConservative: number | null
  paybackYearsBase: number | null
  paybackYearsOptimistic: number | null
  economicScore: number
  sensitivityNotes: string[]
}

export interface PolicyComplianceResult {
  score: number
  imoCiiBenefit: 'high' | 'medium' | 'low' | 'not_applicable' | 'unknown'
  eexiBenefit: 'high' | 'medium' | 'low' | 'not_applicable' | 'unknown'
  fuelEuBenefit: 'high' | 'medium' | 'low' | 'not_applicable' | 'unknown'
  euEtsBenefit: 'high' | 'medium' | 'low' | 'not_applicable' | 'unknown'
  esgValue: 'high' | 'medium' | 'low' | 'unknown'
  greenFinanceValue: 'high' | 'medium' | 'low' | 'unknown'
  applicablePolicies: string[]
  policyUncertainties: string[]
  notes: string[]
}

export interface ShippingOperationResult {
  score: number
  impactLevel: 'low' | 'medium' | 'medium_high' | 'high' | 'unknown'
  majorConflicts: string[]
  mitigationMeasures: string[]
  operationalRedFlags: string[]
  crewTrainingRequired: boolean
  portOperationReviewRequired: boolean
  insuranceReviewRequired: boolean
}

export interface ClassRiskResult {
  score: number
  approvalComplexity: 'low' | 'medium' | 'medium_high' | 'high' | 'unknown'
  likelyRequiredDocuments: string[]
  keyClassConcerns: string[]
  recommendedClassEngagementStage:
    | 'before_concept_design'
    | 'before_detailed_engineering'
    | 'before_installation'
    | 'not_required_for_preliminary_stage'
  requiresFmea: boolean
  requiresStabilityAssessment: boolean
  requiresStructuralReview: boolean
  requiresSeaTrialPlan: boolean
}

export interface StabilityStructureResult {
  score: number
  stabilityRiskLevel: 'low' | 'medium' | 'medium_high' | 'high' | 'unknown'
  structureRiskLevel: 'low' | 'medium' | 'medium_high' | 'high' | 'unknown'
  requiresNavalArchitectReview: boolean
  requiresDeckFoundationReview: boolean
  keyRisks: string[]
  missingCriticalData: string[]
}

export interface ScoreBreakdown {
  vesselSuitability: number
  routeWind: number
  economic: number
  shippingOperation: number
  classRisk: number
  stabilityStructure: number
  policyCompliance: number
  dataCompleteness: number
}

export interface RiskRegisterItem {
  id: string
  category: 'technical' | 'operational' | 'regulatory' | 'financial' | 'structural'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  mitigation: string
}

export interface DataGap {
  field: string
  impact: 'critical' | 'significant' | 'minor'
  description: string
  howToObtain: string
}

export interface NextAction {
  priority: 'immediate' | 'short_term' | 'before_next_stage'
  action: string
  responsible: string
}

export interface AgentSummary {
  agentName: string
  summary: string
  keyFindings: string[]
  recommendations: string[]
}

export interface AssessmentResult {
  projectId: string
  totalScore: number
  rating: 'A' | 'B' | 'C' | 'D' | 'E'
  recommendation:
    | 'proceed_to_detailed_design'
    | 'proceed_with_data_collection'
    | 'research_only'
    | 'not_recommended'
  scores: ScoreBreakdown
  recommendedWapsType: WapsType
  alternativeWapsTypes: WapsType[]
  fuelSaving: FuelSavingResult
  co2Reduction: Co2ReductionResult
  economics: EconomicResult
  vesselSuitability: VesselSuitabilityResult
  routeWind: RouteWindResult
  wapsMatching: WapsMatchingResult
  policyCompliance: PolicyComplianceResult
  shippingOperation: ShippingOperationResult
  classRisk: ClassRiskResult
  stabilityStructure: StabilityStructureResult
  dataCompleteness: DataCompletenessResult
  risks: RiskRegisterItem[]
  dataGaps: DataGap[]
  nextActions: NextAction[]
  agentSummaries: AgentSummary[]
  generatedAt: string
}
