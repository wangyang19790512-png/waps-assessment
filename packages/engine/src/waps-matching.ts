import type {
  VesselProfile,
  DeckProfile,
  WeatherProfile,
  OperationProfile,
  WapsMatchingResult,
  WapsType,
} from '@waps/schemas'

interface WapsScore {
  type: WapsType
  score: number
  pros: string[]
  cons: string[]
}

function scoreRotorSail(
  vessel: VesselProfile,
  deck: DeckProfile,
  weather: WeatherProfile | undefined,
  op: OperationProfile,
): WapsScore {
  let score = 0
  const pros: string[] = []
  const cons: string[] = []

  // Vessel type
  if (['bulk_carrier', 'tanker', 'general_cargo'].includes(vessel.vesselType)) {
    score += 30; pros.push('船型非常适合转子帆')
  } else if (['research', 'training'].includes(vessel.vesselType)) {
    score += 20; pros.push('船型适合转子帆')
  } else {
    score += 10
  }

  // Speed
  if (vessel.serviceSpeedKn <= 14) { score += 20; pros.push('航速适中，转子帆推进贡献率高') }
  else if (vessel.serviceSpeedKn <= 18) { score += 10 }
  else { score -= 10; cons.push('高航速降低转子帆效率') }

  // Deck area
  if ((deck.availableDeckAreaM2 ?? 0) >= 100) { score += 20; pros.push('甲板空间充足') }
  else if ((deck.availableDeckAreaM2 ?? 0) >= 50) { score += 10 }
  else { score -= 10; cons.push('甲板空间有限，限制转子数量') }

  // Cargo conflict
  if (deck.cargoOperationConflict === 'high') { score -= 15; cons.push('装卸冲突高') }
  else if (deck.cargoOperationConflict === 'none' || deck.cargoOperationConflict === 'low') {
    score += 15; pros.push('装卸冲突低')
  }

  // Technology maturity bonus
  score += 15; pros.push('技术成熟度高，有大量商业案例（Viking Line、Maersk 等）')

  return { type: 'rotor_sail', score: Math.max(0, score), pros, cons }
}

function scoreRigidWingSail(
  vessel: VesselProfile,
  deck: DeckProfile,
  weather: WeatherProfile | undefined,
  op: OperationProfile,
): WapsScore {
  let score = 0
  const pros: string[] = []
  const cons: string[] = []

  if (['bulk_carrier', 'container', 'tanker'].includes(vessel.vesselType)) {
    score += 25; pros.push('大型船舶适合硬翼帆')
  } else { score += 10 }

  if (vessel.loaM >= 150) { score += 20; pros.push('船长充裕，硬翼帆安装基础佳') }
  else if (vessel.loaM >= 100) { score += 10 }
  else { score -= 15; cons.push('船体偏小，硬翼帆结构要求高') }

  if (vessel.serviceSpeedKn <= 12) { score += 20; pros.push('低速船硬翼帆推力贡献显著') }
  else if (vessel.serviceSpeedKn <= 16) { score += 15 }
  else { score -= 15; cons.push('高速降低硬翼帆效率') }

  if ((deck.availableDeckAreaM2 ?? 0) >= 150) { score += 20; pros.push('甲板宽敞，支持大型硬翼帆') }
  else if ((deck.availableDeckAreaM2 ?? 0) >= 100) { score += 10 }
  else { score -= 15; cons.push('甲板空间不足，安装受限') }

  if (deck.bridgeVisibilityImpact === 'high') { score -= 20; cons.push('视线影响严重') }
  else if (deck.bridgeVisibilityImpact === 'none' || deck.bridgeVisibilityImpact === 'low') {
    score += 15; pros.push('视线影响小')
  }

  return { type: 'rigid_wing_sail', score: Math.max(0, score), pros, cons }
}

function scoreSuctionWing(
  vessel: VesselProfile,
  deck: DeckProfile,
  weather: WeatherProfile | undefined,
  op: OperationProfile,
): WapsScore {
  let score = 0
  const pros: string[] = []
  const cons: string[] = []

  if (['container', 'general_cargo', 'ferry'].includes(vessel.vesselType)) {
    score += 30; pros.push('船型适合吸力翼（紧凑外形，视线影响小）')
  } else { score += 10 }

  if (vessel.loaM >= 80 && vessel.loaM <= 200) {
    score += 20; pros.push('船长适中')
  }

  if (vessel.serviceSpeedKn <= 16) { score += 15 }
  else { cons.push('高速降低吸力翼效率') }

  if ((deck.availableDeckAreaM2 ?? 0) >= 80) { score += 15; pros.push('甲板面积满足吸力翼要求') }
  else { cons.push('甲板面积偏小') }

  pros.push('吸力翼外形紧凑，对视线和装卸影响较小')

  return { type: 'suction_wing', score: Math.max(0, score), pros, cons }
}

function scoreSoftSail(
  vessel: VesselProfile,
  deck: DeckProfile,
  weather: WeatherProfile | undefined,
  op: OperationProfile,
): WapsScore {
  let score = 0
  const pros: string[] = []
  const cons: string[] = []

  if (vessel.loaM <= 100) { score += 30; pros.push('小型船舶适合软帆方案') }
  else if (vessel.loaM <= 130) { score += 20 }
  else { score -= 10; cons.push('大型船舶软帆推进效率偏低') }

  if (op.crewSkillLevel === 'high') { score += 20; pros.push('高技能船员可安全操作软帆') }
  else if (op.crewSkillLevel === 'medium') { score += 5 }
  else { score -= 15; cons.push('软帆操作对船员技能要求较高') }

  if (op.maintenanceCapability === 'high') { score += 15; pros.push('维护能力强，软帆适合') }
  else if (op.maintenanceCapability === 'low') { score -= 20; cons.push('维护能力不足，软帆易损件管理困难') }

  if (vessel.serviceSpeedKn <= 12) { score += 20; pros.push('低速适合软帆') }

  pros.push('初始投资最低，适合预算有限项目')

  return { type: 'soft_sail', score: Math.max(0, score), pros, cons }
}

function scoreKiteSystem(
  vessel: VesselProfile,
  deck: DeckProfile,
  weather: WeatherProfile | undefined,
  op: OperationProfile,
): WapsScore {
  let score = 0
  const pros: string[] = []
  const cons: string[] = []

  if ((op as any).routeDistanceNm >= 500 || true) {
    // Use route indirectly via operation context
  }

  if (vessel.serviceSpeedKn >= 10 && vessel.serviceSpeedKn <= 16) {
    score += 20; pros.push('航速适合风筝系统工作区间')
  }

  if ((op.portCallFrequencyPerMonth ?? 999) <= 2) {
    score += 15; pros.push('靠港频率低，风筝系统部署收益高')
  } else if ((op.portCallFrequencyPerMonth ?? 0) >= 6) {
    score -= 20; cons.push('靠港频率过高，风筝每次收放增加操作负担')
  }

  if (op.crewSkillLevel === 'high') { score += 20; pros.push('高技能船员可安全操作风筝') }
  else if (op.crewSkillLevel === 'medium') { score += 5 }
  else { score -= 20; cons.push('风筝系统操作复杂，低技能船员存在安全风险') }

  if ((weather?.downwindPercentage ?? 0) >= 30) {
    score += 20; pros.push('顺风比例高，风筝效率突出')
  }

  pros.push('适合远洋长航线，顺风和侧风段效率高')
  cons.push('操作复杂度最高，紧急情况收放要求高')

  return { type: 'kite_system', score: Math.max(0, score), pros, cons }
}

export function matchWapsType(
  vessel: VesselProfile,
  deck: DeckProfile,
  weather: WeatherProfile | undefined,
  operation: OperationProfile,
): WapsMatchingResult {
  const scores: WapsScore[] = [
    scoreRotorSail(vessel, deck, weather, operation),
    scoreRigidWingSail(vessel, deck, weather, operation),
    scoreSuctionWing(vessel, deck, weather, operation),
    scoreSoftSail(vessel, deck, weather, operation),
    scoreKiteSystem(vessel, deck, weather, operation),
  ]

  scores.sort((a, b) => b.score - a.score)

  const RECOMMEND_THRESHOLD = 40
  const recommended = scores[0]
  const alternatives = scores.slice(1).filter(s => s.score >= RECOMMEND_THRESHOLD)
  const notRecommended = scores.filter(s => s.score < RECOMMEND_THRESHOLD)

  const recommendedType: WapsType =
    recommended.score >= RECOMMEND_THRESHOLD ? recommended.type : 'not_recommended'

  const reasoning = recommended.pros.slice(0, 3)
  const technologyRisks = recommended.cons

  const nextValidationTasks = [
    '确认甲板可用区域的精确尺寸和承载能力',
    '开展航线气象详细分析（ERA5 或商业气象数据）',
    '与设备供应商获取初步方案和报价',
    `联系 ${vessel.classSociety ?? '对应船级社'} 进行早期技术预沟通`,
  ]

  return {
    recommendedType,
    alternativeTypes: alternatives.map(s => s.type),
    notRecommendedTypes: notRecommended.map(s => s.type),
    reasoning,
    technologyRisks,
    nextValidationTasks,
  }
}
