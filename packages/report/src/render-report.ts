import type { AssessmentProject, AssessmentResult } from '@waps/schemas'

const WAPS_LABELS: Record<string, string> = {
  rotor_sail: '转子帆（Rotor Sail）',
  rigid_wing_sail: '硬翼帆（Rigid Wing Sail）',
  suction_wing: '吸力翼（Suction Wing）',
  soft_sail: '软帆（Soft Sail）',
  kite_system: '风筝系统（Kite System）',
  not_recommended: '暂不建议',
}

const VESSEL_TYPE_LABELS: Record<string, string> = {
  bulk_carrier: '散货船',
  tanker: '油轮',
  container: '集装箱船',
  general_cargo: '通用货船',
  offshore_support: '海工支持船',
  research: '科考船',
  training: '训练船',
  ferry: '客渡船',
  port_service: '港口服务船',
  other: '其他',
}

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: decimals })
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%'
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${score}`
}

function ratingDesc(rating: string): string {
  const map: Record<string, string> = {
    A: '强烈建议进入详细设计和试点',
    B: '建议进入下一阶段，需补充关键数据',
    C: '可继续研究，不建议立即改造',
    D: '暂不建议商业改造，仅可作为示范',
    E: '不建议推进',
  }
  return map[rating] ?? ''
}

function recommendationLabel(rec: string): string {
  const map: Record<string, string> = {
    proceed_to_detailed_design: '建议推进：立即启动详细工程设计',
    proceed_with_data_collection: '建议推进：补充关键数据后启动详细设计',
    research_only: '研究阶段：暂不建议商业改造',
    not_recommended: '不建议推进',
  }
  return map[rec] ?? rec
}

export function renderReport(
  project: AssessmentProject,
  result: AssessmentResult,
): string {
  const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const sections: string[] = []

  // ── Header ──────────────────────────────────────────────────────────────────
  sections.push(`# WAPS 船舶风能辅助改造适配评估报告

**项目名称：** ${project.projectName}
**客户名称：** ${project.clientName ?? '—'}
**船舶名称：** ${project.vessel.vesselName ?? '—'}
**评估日期：** ${date}
**报告版本：** V1.0（初步评估）

---`)

  // ── 1. Executive Summary ───────────────────────────────────────────────────
  sections.push(`## 1. 管理层摘要

基于当前数据，本船 WAPS 综合适配评分为 **${result.totalScore} / 100**，评估等级为 **${result.rating} 级**。

> **${ratingDesc(result.rating)}**

**系统建议：** ${recommendationLabel(result.recommendation)}

**推荐 WAPS 技术路线：** ${WAPS_LABELS[result.recommendedWapsType] ?? result.recommendedWapsType}

${result.alternativeWapsTypes.length > 0 ? `**备选技术路线：** ${result.alternativeWapsTypes.map(t => WAPS_LABELS[t]).join('、')}` : ''}

### 核心指标预览

| 情景 | 节油率 | 年节油量 | 年 CO₂ 减排 | 投资回收期 |
|---|---:|---:|---:|---:|
| 保守 | ${pct(result.fuelSaving.conservativeRate)} | ${fmt(result.fuelSaving.conservativeFuelSavingT)} t | ${fmt(result.co2Reduction.conservativeCo2ReductionT)} t | ${fmt(result.economics.paybackYearsConservative, 1)} 年 |
| 中性 | ${pct(result.fuelSaving.baseRate)} | ${fmt(result.fuelSaving.baseFuelSavingT)} t | ${fmt(result.co2Reduction.baseCo2ReductionT)} t | ${fmt(result.economics.paybackYearsBase, 1)} 年 |
| 乐观 | ${pct(result.fuelSaving.optimisticRate)} | ${fmt(result.fuelSaving.optimisticFuelSavingT)} t | ${fmt(result.co2Reduction.optimisticCo2ReductionT)} t | ${fmt(result.economics.paybackYearsOptimistic, 1)} 年 |

---`)

  // ── 2. Vessel & Route Overview ─────────────────────────────────────────────
  sections.push(`## 2. 船舶与航线概况

### 2.1 船舶基础信息

| 参数 | 数值 |
|---|---|
| 船舶类型 | ${VESSEL_TYPE_LABELS[project.vessel.vesselType] ?? project.vessel.vesselType} |
| 船旗国 | ${project.vessel.flag ?? '—'} |
| 船级社 | ${project.vessel.classSociety ?? '—'} |
| 建造年份 | ${project.vessel.yearBuilt ?? '—'} |
| 总长 LOA | ${project.vessel.loaM} m |
| 型宽 | ${project.vessel.beamM} m |
| 设计吃水 | ${project.vessel.draftM ?? '—'} m |
| 载重吨 DWT | ${project.vessel.dwtT ? fmt(project.vessel.dwtT) + ' t' : '—'} |
| 总吨 GT | ${project.vessel.grossTonnage ? fmt(project.vessel.grossTonnage) : '—'} |
| 服务航速 | ${project.vessel.serviceSpeedKn} kn |
| 主机功率 | ${project.vessel.mainEnginePowerKw ? fmt(project.vessel.mainEnginePowerKw) + ' kW' : '—'} |

### 2.2 航线与燃油信息

| 参数 | 数值 |
|---|---|
| 航线 | ${project.route.originPort ?? '—'} → ${project.route.destinationPort ?? '—'} |
| 航线距离 | ${project.route.routeDistanceNm ? fmt(project.route.routeDistanceNm) + ' 海里' : '—'} |
| 年航次 | ${project.route.voyageCountPerYear ?? '—'} 次/年 |
| 季节性模式 | ${project.route.seasonalPattern ?? '—'} |
| 停靠欧盟港口 | ${project.route.callsEuPorts ? '是' : '否'} |
| 燃油类型 | ${project.fuel.fuelType} |
| 年燃油消耗 | ${project.fuel.annualFuelConsumptionT ? fmt(project.fuel.annualFuelConsumptionT) + ' t' : '—'} |
| 燃油价格 | ${project.fuel.fuelPriceUsdPerT ? '$' + fmt(project.fuel.fuelPriceUsdPerT) + '/t' : '—'} |
| 年运营天数 | ${project.operation.annualOperatingDays ?? project.fuel.annualOperatingDays ?? '—'} 天 |

---`)

  // ── 3. Data Completeness ──────────────────────────────────────────────────
  const dc = result.dataCompleteness
  sections.push(`## 3. 数据完整性与结论可信度

**数据完整性评分：** ${dc.score} / 100（${dc.level === 'high' ? '高' : dc.level === 'medium' ? '中' : '低'}）

${dc.canGeneratePreliminaryReport ? '✅ 当前数据可支持生成初步评估报告。' : '⚠️ 当前数据不足，以下结论可信度较低，需补充关键数据后重新评估。'}
${dc.requiresExpertReview ? '\n> **注意：** 本报告需经过海事设计师或船级社专家审核后方可用于投资决策。' : ''}

${dc.criticalMissingFields.length > 0 ? `### 关键缺失数据（影响结论可信度）

${dc.criticalMissingFields.map(f => `- \`${f}\``).join('\n')}

**获取建议：**
${dc.recommendedDataRequests.map(r => `- ${r}`).join('\n')}` : '> 所有关键数据已提供。'}

---`)

  // ── 4. Overall Score ──────────────────────────────────────────────────────
  const s = result.scores
  sections.push(`## 4. 综合评分

| 评估维度 | 得分 | 权重 | 可视化 |
|---|---:|---:|---|
| 船型适配 | ${s.vesselSuitability} | 20% | ${scoreBar(s.vesselSuitability)} |
| 航线风资源 | ${s.routeWind} | 20% | ${scoreBar(s.routeWind)} |
| 经济可行性 | ${s.economic} | 20% | ${scoreBar(s.economic)} |
| 航运运营影响 | ${s.shippingOperation} | 15% | ${scoreBar(s.shippingOperation)} |
| 船级社风险 | ${s.classRisk} | 10% | ${scoreBar(s.classRisk)} |
| 稳性与结构 | ${s.stabilityStructure} | 10% | ${scoreBar(s.stabilityStructure)} |
| 政策合规价值 | ${s.policyCompliance} | 5% | ${scoreBar(s.policyCompliance)} |
| **综合得分** | **${result.totalScore}** | **100%** | **等级：${result.rating}** |

---`)

  // ── 5. Vessel Suitability ─────────────────────────────────────────────────
  const vs = result.vesselSuitability
  sections.push(`## 5. 船型适配分析

**评分：** ${vs.score} / 100 | **等级：** ${vs.level.replace('_', ' ')}

${vs.positiveFactors.length > 0 ? `### 正面因素\n${vs.positiveFactors.map(f => `- ✅ ${f}`).join('\n')}` : ''}

${vs.constraints.length > 0 ? `### 限制因素\n${vs.constraints.map(c => `- ⚠️ ${c}`).join('\n')}` : ''}

${vs.redFlags.length > 0 ? `### 红线风险\n${vs.redFlags.map(r => `- 🔴 ${r}`).join('\n')}` : '> 未发现红线风险。'}

${vs.requiresNavalArchitectReview ? '> **建议：** 本船应聘请海事设计院进行专业评估，再作出改造决策。' : ''}

---`)

  // ── 6. Route Wind ─────────────────────────────────────────────────────────
  const rw = result.routeWind
  sections.push(`## 6. 航线风资源分析

**评分：** ${rw.score} / 100 | **适用性：** ${rw.routeRecommendation.replace(/_/g, ' ')}

| 参数 | 数值 |
|---|---|
| 平均真风速 | ${rw.averageTrueWindSpeedMs ? rw.averageTrueWindSpeedMs + ' m/s' : '未知'} |
| 有利风向占比 | ${rw.favorableWindPercentage ? rw.favorableWindPercentage + '%' : '未知'} |
| 有效风能利用率 | ${pct(rw.effectiveWindUtilizationRatio)} |
| 季节性变化 | ${rw.seasonalVariability} |
${rw.bestSeason ? `| 最佳季节 | ${rw.bestSeason} |` : ''}
${rw.worstSeason ? `| 最差季节 | ${rw.worstSeason} |` : ''}

${rw.routeRecommendation === 'insufficient_data' ? '> ⚠️ **气象数据不足：** 当前风资源评分基于缺省假设，不代表真实航线风况。建议获取 ERA5 或商业气象数据后重新评估。' : ''}

---`)

  // ── 7. WAPS Technology ────────────────────────────────────────────────────
  const wm = result.wapsMatching
  sections.push(`## 7. WAPS 技术路线推荐

**推荐：** ${WAPS_LABELS[wm.recommendedType]}
${wm.alternativeTypes.length > 0 ? `**备选：** ${wm.alternativeTypes.map(t => WAPS_LABELS[t]).join('、')}` : ''}
${wm.notRecommendedTypes.length > 0 ? `**不建议：** ${wm.notRecommendedTypes.map(t => WAPS_LABELS[t]).join('、')}` : ''}

### 推荐理由
${wm.reasoning.map(r => `- ${r}`).join('\n')}

### 主要技术风险
${wm.technologyRisks.length > 0 ? wm.technologyRisks.map(r => `- ⚠️ ${r}`).join('\n') : '- 暂无特别技术风险'}

### 下一阶段验证任务
${wm.nextValidationTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

---`)

  // ── 8. Fuel Saving & CO2 ─────────────────────────────────────────────────
  const fs = result.fuelSaving
  const co2 = result.co2Reduction
  sections.push(`## 8. 节油与 CO₂ 减排测算

> **重要说明：** 以下数据为基于参数假设的区间估算，不构成性能保证。

### 节油率与年节油量

| 情景 | 节油率 | 年节油量 | 年燃油成本节省 |
|---|---:|---:|---:|
| 保守 | ${pct(fs.conservativeRate)} | ${fmt(fs.conservativeFuelSavingT)} t | $${fmt(result.economics.annualFuelCostSavingConservativeUsd)} |
| 中性 | ${pct(fs.baseRate)} | ${fmt(fs.baseFuelSavingT)} t | $${fmt(result.economics.annualFuelCostSavingBaseUsd)} |
| 乐观 | ${pct(fs.optimisticRate)} | ${fmt(fs.optimisticFuelSavingT)} t | $${fmt(result.economics.annualFuelCostSavingOptimisticUsd)} |

### 年 CO₂ 减排量（使用排放因子 ${co2.emissionFactorUsed} tCO₂/t 燃油）

| 情景 | 年 CO₂ 减排 |
|---|---:|
| 保守 | ${fmt(co2.conservativeCo2ReductionT)} t |
| 中性 | ${fmt(co2.baseCo2ReductionT)} t |
| 乐观 | ${fmt(co2.optimisticCo2ReductionT)} t |

### 计算假设
${fs.assumptions.map(a => `- ${a}`).join('\n')}

### 不确定性因素
${fs.uncertaintyFactors.map(u => `- ${u}`).join('\n')}

---`)

  // ── 9. Economics ──────────────────────────────────────────────────────────
  const ec = result.economics
  sections.push(`## 9. 经济性分析（CAPEX / OPEX / Payback）

### 初始投资（CAPEX）估算

| 情景 | 金额 |
|---|---:|
| 低估 | $${fmt(ec.capexLowUsd)} |
| 基准 | $${fmt(ec.capexBaseUsd)} |
| 高估 | $${fmt(ec.capexHighUsd)} |

> CAPEX 区间基于同类项目市场参考，不含项目特定结构加强费用。建议向供应商获取正式报价后更新。

**年度运维成本（OPEX）：** $${fmt(ec.annualOpexUsd)} / 年

### 投资回收期

| 情景 | 年节省燃油成本 | 年净收益（扣除 OPEX） | 回收期（以基准 CAPEX） |
|---|---:|---:|---:|
| 保守 | $${fmt(ec.annualFuelCostSavingConservativeUsd)} | $${fmt(ec.annualFuelCostSavingConservativeUsd - ec.annualOpexUsd)} | ${ec.paybackYearsConservative !== null ? ec.paybackYearsConservative + ' 年' : '无法回收'} |
| 中性 | $${fmt(ec.annualFuelCostSavingBaseUsd)} | $${fmt(ec.annualFuelCostSavingBaseUsd - ec.annualOpexUsd)} | ${ec.paybackYearsBase !== null ? ec.paybackYearsBase + ' 年' : '无法回收'} |
| 乐观 | $${fmt(ec.annualFuelCostSavingOptimisticUsd)} | $${fmt(ec.annualFuelCostSavingOptimisticUsd - ec.annualOpexUsd)} | ${ec.paybackYearsOptimistic !== null ? ec.paybackYearsOptimistic + ' 年' : '无法回收'} |

### 敏感性说明
${ec.sensitivityNotes.map(n => `- ${n}`).join('\n')}

---`)

  // ── 10. Policy Compliance ─────────────────────────────────────────────────
  const pc = result.policyCompliance
  sections.push(`## 10. 政策合规价值

**评分：** ${pc.score} / 100

### 适用政策

${pc.applicablePolicies.length > 0
  ? pc.applicablePolicies.map(p => `- ✅ ${p}`).join('\n')
  : '- 暂未识别到明确适用政策'}

### 各政策潜在帮助

| 政策 | 帮助程度 |
|---|---|
| IMO CII | ${pc.imoCiiBenefit} |
| IMO EEXI | ${pc.eexiBenefit} |
| FuelEU Maritime | ${pc.fuelEuBenefit} |
| EU ETS | ${pc.euEtsBenefit} |
| ESG 披露 | ${pc.esgValue} |
| 绿色金融 | ${pc.greenFinanceValue} |

### 注意事项
${pc.notes.map(n => `- ${n}`).join('\n')}

### 政策不确定性
${pc.policyUncertainties.map(u => `- ⚠️ ${u}`).join('\n')}

---`)

  // ── 11. Shipping Operation ────────────────────────────────────────────────
  const so = result.shippingOperation
  sections.push(`## 11. 航运管理与运营影响

**评分：** ${so.score} / 100 | **影响等级：** ${so.impactLevel.replace('_', ' ')}

${so.majorConflicts.length > 0 ? `### 主要冲突点\n${so.majorConflicts.map(c => `- ⚠️ ${c}`).join('\n')}` : '> 未发现重大运营冲突。'}

${so.mitigationMeasures.length > 0 ? `### 缓解措施\n${so.mitigationMeasures.map(m => `- ${m}`).join('\n')}` : ''}

${so.operationalRedFlags.length > 0 ? `### 运营红线\n${so.operationalRedFlags.map(r => `- 🔴 ${r}`).join('\n')}` : ''}

| 行动项 | 是否需要 |
|---|---|
| 船员培训 | ${so.crewTrainingRequired ? '✅ 需要' : '—'} |
| 港口与装卸复核 | ${so.portOperationReviewRequired ? '✅ 需要' : '—'} |
| 保险重新评估 | ${so.insuranceReviewRequired ? '✅ 需要' : '—'} |

---`)

  // ── 12. Class Risk ────────────────────────────────────────────────────────
  const cr = result.classRisk
  sections.push(`## 12. 船级社风险与认证路径

**评分：** ${cr.score} / 100 | **审查复杂度：** ${cr.approvalComplexity.replace('_', ' ')}

**建议与船级社沟通时机：** ${cr.recommendedClassEngagementStage.replace(/_/g, ' ')}

### 船级社重点关注事项
${cr.keyClassConcerns.length > 0
  ? cr.keyClassConcerns.map(c => `- ⚠️ ${c}`).join('\n')
  : '- 暂无特别关注事项'}

### 可能需要提交的文件
${cr.likelyRequiredDocuments.map((d, i) => `${i + 1}. ${d}`).join('\n')}

| 审查要求 | 结论 |
|---|---|
| 需要 FMEA | ${cr.requiresFmea ? '✅ 是' : '否'} |
| 需要稳性重新评估 | ${cr.requiresStabilityAssessment ? '✅ 是' : '否'} |
| 需要结构审查 | ${cr.requiresStructuralReview ? '✅ 是' : '否'} |
| 需要海试方案 | ${cr.requiresSeaTrialPlan ? '✅ 是' : '否'} |

---`)

  // ── 13. Stability & Structure ─────────────────────────────────────────────
  const ss = result.stabilityStructure
  sections.push(`## 13. 稳性与结构初筛

**评分：** ${ss.score} / 100

> **免责声明：** 本节仅为前期初筛，不构成正式稳性结论，不可替代持牌海事设计师的正式稳性计算。

| 风险维度 | 等级 |
|---|---|
| 稳性风险 | ${ss.stabilityRiskLevel.replace('_', ' ')} |
| 结构风险 | ${ss.structureRiskLevel.replace('_', ' ')} |
| 需要船舶设计师审查 | ${ss.requiresNavalArchitectReview ? '✅ 是' : '否'} |
| 需要甲板基座专项审查 | ${ss.requiresDeckFoundationReview ? '✅ 是' : '否'} |

${ss.keyRisks.length > 0 ? `### 关键风险\n${ss.keyRisks.map(r => `- 🔴 ${r}`).join('\n')}` : ''}

${ss.missingCriticalData.length > 0 ? `### 缺失关键数据\n${ss.missingCriticalData.map(d => `- \`${d}\``).join('\n')}` : ''}

---`)

  // ── 14. Risk Register ─────────────────────────────────────────────────────
  if (result.risks.length > 0) {
    const severityIcon: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }
    sections.push(`## 14. 关键风险清单

| 编号 | 类别 | 严重度 | 描述 | 缓解措施 |
|---|---|---|---|---|
${result.risks.map(r => `| ${r.id} | ${r.category} | ${severityIcon[r.severity] ?? ''} ${r.severity} | ${r.description} | ${r.mitigation} |`).join('\n')}

---`)
  }

  // ── 15. Data Gaps ─────────────────────────────────────────────────────────
  if (result.dataGaps.length > 0) {
    sections.push(`## 15. 数据缺口清单

| 字段 | 影响程度 | 说明 |
|---|---|---|
${result.dataGaps.map(g => `| \`${g.field}\` | ${g.impact} | ${g.description} |`).join('\n')}

---`)
  }

  // ── 16. Next Actions ──────────────────────────────────────────────────────
  sections.push(`## 16. 下一步行动建议

${result.nextActions.map((a, i) => `**${i + 1}. [${a.priority.replace('_', ' ').toUpperCase()}]** ${a.action}\n   *责任方：${a.responsible}*`).join('\n\n')}

---`)

  // ── 17. Disclaimer ────────────────────────────────────────────────────────
  sections.push(`## 17. 免责声明

本报告为前期适配评估，不构成正式船舶设计文件、船级社审查意见、施工图纸或性能保证。节油率、CO₂ 减排量和投资回收期均基于当前数据和模型假设，须在详细设计、实船测试和第三方验证后进一步确认。政策合规相关内容不构成法律意见，须咨询专业合规顾问。

**报告生成时间：** ${result.generatedAt}`)

  return sections.join('\n\n')
}
