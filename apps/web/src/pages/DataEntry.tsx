import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const TABS = ['基础信息', '船舶', '航线', '燃油', '气象', '甲板', '稳性', '运营', '政策']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      {children}
    </select>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────
const str = (v: unknown) => (v != null ? String(v) : '')
const bool = (v: unknown) => (v != null ? String(v) : 'false')

export function DataEntry() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()        // defined only in edit mode
  const isEdit = Boolean(id)

  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [basic, setBasic] = useState({ projectName: '', clientName: '' })
  const [vessel, setVessel] = useState({
    vesselName: '', vesselType: 'general_cargo', flag: 'Singapore',
    classSociety: 'DNV', yearBuilt: '2015', loaM: '120', beamM: '20',
    draftM: '7', dwtT: '10000', grossTonnage: '8000',
    serviceSpeedKn: '12', mainEnginePowerKw: '4500',
  })
  const [route, setRoute] = useState({
    routeName: '', originPort: '', destinationPort: '',
    routeDistanceNm: '', voyageCountPerYear: '',
    seasonalPattern: 'mixed', callsEuPorts: 'false',
  })
  const [fuel, setFuel] = useState({
    fuelType: 'VLSFO', annualFuelConsumptionT: '',
    fuelPriceUsdPerT: '', annualOperatingDays: '',
  })
  const [weather, setWeather] = useState({
    averageTrueWindSpeedMs: '', favorableWindPercentage: '',
    seasonalVariability: 'medium',
  })
  const [deck, setDeck] = useState({
    availableDeckAreaM2: '', maxAllowableInstallationHeightM: '',
    cargoOperationConflict: 'low', craneOperationConflict: 'low',
    bridgeVisibilityImpact: 'low',
  })
  const [stability, setStability] = useState({
    gmM: '', maxAllowableAdditionalWeightT: '', deckLoadLimitTPerM2: '',
    stabilityBookletAvailable: 'false', structuralDrawingsAvailable: 'false',
    incliningTestDataAvailable: 'false',
  })
  const [operation, setOperation] = useState({
    annualOperatingDays: '', cargoOperationType: 'bulk',
    crewSkillLevel: 'medium', scheduleSensitivity: 'medium',
    insuranceConcernLevel: 'low', portRestrictionLevel: 'low',
  })
  const [policy, setPolicy] = useState({
    imoCiiApplicable: 'true', eexiApplicable: 'true', seempApplicable: 'true',
    fuelEuApplicable: 'false', euEtsApplicable: 'false',
    esgReportingRequired: 'false', greenFinanceInterest: 'false',
    domesticGreenShippingProgram: 'false',
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (!id) return
    api.getProject(id).then(stored => {
      const p = stored.project
      const v = p.vessel as Record<string, unknown>
      const r = p.route as Record<string, unknown>
      const f = p.fuel as Record<string, unknown>
      const w = (p.weather ?? {}) as Record<string, unknown>
      const d = p.deck as Record<string, unknown>
      const s = (p.stability ?? {}) as Record<string, unknown>
      const o = p.operation as Record<string, unknown>
      const pol = p.policy as Record<string, unknown>

      setBasic({ projectName: p.projectName, clientName: p.clientName ?? '' })
      setVessel({
        vesselName: str(v.vesselName), vesselType: str(v.vesselType) || 'general_cargo',
        flag: str(v.flag), classSociety: str(v.classSociety) || 'DNV',
        yearBuilt: str(v.yearBuilt), loaM: str(v.loaM), beamM: str(v.beamM),
        draftM: str(v.draftM), dwtT: str(v.dwtT), grossTonnage: str(v.grossTonnage),
        serviceSpeedKn: str(v.serviceSpeedKn), mainEnginePowerKw: str(v.mainEnginePowerKw),
      })
      setRoute({
        routeName: str(r.routeName), originPort: str(r.originPort),
        destinationPort: str(r.destinationPort), routeDistanceNm: str(r.routeDistanceNm),
        voyageCountPerYear: str(r.voyageCountPerYear),
        seasonalPattern: str(r.seasonalPattern) || 'mixed',
        callsEuPorts: bool(r.callsEuPorts),
      })
      setFuel({
        fuelType: str(f.fuelType) || 'VLSFO',
        annualFuelConsumptionT: str(f.annualFuelConsumptionT),
        fuelPriceUsdPerT: str(f.fuelPriceUsdPerT),
        annualOperatingDays: str(f.annualOperatingDays),
      })
      setWeather({
        averageTrueWindSpeedMs: str(w.averageTrueWindSpeedMs),
        favorableWindPercentage: str(w.favorableWindPercentage),
        seasonalVariability: str(w.seasonalVariability) || 'medium',
      })
      setDeck({
        availableDeckAreaM2: str(d.availableDeckAreaM2),
        maxAllowableInstallationHeightM: str(d.maxAllowableInstallationHeightM),
        cargoOperationConflict: str(d.cargoOperationConflict) || 'low',
        craneOperationConflict: str(d.craneOperationConflict) || 'low',
        bridgeVisibilityImpact: str(d.bridgeVisibilityImpact) || 'low',
      })
      setStability({
        gmM: str(s.gmM), maxAllowableAdditionalWeightT: str(s.maxAllowableAdditionalWeightT),
        deckLoadLimitTPerM2: str(s.deckLoadLimitTPerM2),
        stabilityBookletAvailable: bool(s.stabilityBookletAvailable),
        structuralDrawingsAvailable: bool(s.structuralDrawingsAvailable),
        incliningTestDataAvailable: bool(s.incliningTestDataAvailable),
      })
      setOperation({
        annualOperatingDays: str(o.annualOperatingDays),
        cargoOperationType: str(o.cargoOperationType) || 'bulk',
        crewSkillLevel: str(o.crewSkillLevel) || 'medium',
        scheduleSensitivity: str(o.scheduleSensitivity) || 'medium',
        insuranceConcernLevel: str(o.insuranceConcernLevel) || 'low',
        portRestrictionLevel: str(o.portRestrictionLevel) || 'low',
      })
      setPolicy({
        imoCiiApplicable: bool(pol.imoCiiApplicable),
        eexiApplicable: bool(pol.eexiApplicable),
        seempApplicable: bool(pol.seempApplicable),
        fuelEuApplicable: bool(pol.fuelEuApplicable),
        euEtsApplicable: bool(pol.euEtsApplicable),
        esgReportingRequired: bool(pol.esgReportingRequired),
        greenFinanceInterest: bool(pol.greenFinanceInterest),
        domesticGreenShippingProgram: bool(pol.domesticGreenShippingProgram),
      })
    }).catch(() => setError('加载项目数据失败')).finally(() => setLoading(false))
  }, [id])

  function b(val: string) { return val === 'true' }
  function n(val: string) { return val ? parseFloat(val) : undefined }
  function ni(val: string) { return val ? parseInt(val) : undefined }

  function buildPayload() {
    return {
      projectName: basic.projectName,
      clientName: basic.clientName || undefined,
      vessel: {
        vesselName: vessel.vesselName || undefined,
        vesselType: vessel.vesselType,
        flag: vessel.flag || undefined,
        classSociety: vessel.classSociety || undefined,
        yearBuilt: ni(vessel.yearBuilt),
        loaM: n(vessel.loaM)!,
        beamM: n(vessel.beamM)!,
        draftM: n(vessel.draftM),
        dwtT: n(vessel.dwtT),
        grossTonnage: n(vessel.grossTonnage),
        serviceSpeedKn: n(vessel.serviceSpeedKn)!,
        mainEnginePowerKw: n(vessel.mainEnginePowerKw),
      },
      route: {
        routeName: route.routeName || undefined,
        originPort: route.originPort || undefined,
        destinationPort: route.destinationPort || undefined,
        routeDistanceNm: n(route.routeDistanceNm),
        voyageCountPerYear: ni(route.voyageCountPerYear),
        seasonalPattern: route.seasonalPattern || undefined,
        callsEuPorts: b(route.callsEuPorts),
      },
      fuel: {
        fuelType: fuel.fuelType,
        annualFuelConsumptionT: n(fuel.annualFuelConsumptionT),
        fuelPriceUsdPerT: n(fuel.fuelPriceUsdPerT),
        annualOperatingDays: ni(fuel.annualOperatingDays),
      },
      weather: weather.averageTrueWindSpeedMs ? {
        averageTrueWindSpeedMs: n(weather.averageTrueWindSpeedMs),
        favorableWindPercentage: n(weather.favorableWindPercentage),
        seasonalVariability: weather.seasonalVariability,
      } : undefined,
      deck: {
        availableDeckAreaM2: n(deck.availableDeckAreaM2),
        maxAllowableInstallationHeightM: n(deck.maxAllowableInstallationHeightM),
        cargoOperationConflict: deck.cargoOperationConflict,
        craneOperationConflict: deck.craneOperationConflict,
        bridgeVisibilityImpact: deck.bridgeVisibilityImpact,
      },
      stability: stability.gmM ? {
        gmM: n(stability.gmM),
        maxAllowableAdditionalWeightT: n(stability.maxAllowableAdditionalWeightT),
        deckLoadLimitTPerM2: n(stability.deckLoadLimitTPerM2),
        stabilityBookletAvailable: b(stability.stabilityBookletAvailable),
        structuralDrawingsAvailable: b(stability.structuralDrawingsAvailable),
        incliningTestDataAvailable: b(stability.incliningTestDataAvailable),
      } : undefined,
      operation: {
        annualOperatingDays: ni(operation.annualOperatingDays),
        cargoOperationType: operation.cargoOperationType,
        crewSkillLevel: operation.crewSkillLevel,
        scheduleSensitivity: operation.scheduleSensitivity,
        insuranceConcernLevel: operation.insuranceConcernLevel,
        portRestrictionLevel: operation.portRestrictionLevel,
      },
      policy: {
        imoCiiApplicable: b(policy.imoCiiApplicable),
        eexiApplicable: b(policy.eexiApplicable),
        seempApplicable: b(policy.seempApplicable),
        fuelEuApplicable: b(policy.fuelEuApplicable),
        euEtsApplicable: b(policy.euEtsApplicable),
        esgReportingRequired: b(policy.esgReportingRequired),
        greenFinanceInterest: b(policy.greenFinanceInterest),
        domesticGreenShippingProgram: b(policy.domesticGreenShippingProgram),
      },
    }
  }

  async function handleSubmit() {
    if (!basic.projectName.trim()) { setError('请填写项目名称'); setTab(0); return }
    if (!(parseFloat(vessel.loaM) > 0) || !(parseFloat(vessel.beamM) > 0) || !(parseFloat(vessel.serviceSpeedKn) > 0)) { setError('请填写有效的船舶必填字段（LOA、型宽、航速须大于 0）'); setTab(1); return }

    setSubmitting(true); setError('')
    try {
      const payload = buildPayload()
      if (isEdit && id) {
        await api.updateProject(id, payload)
        navigate(`/project/${id}`)
      } else {
        const { assessmentId } = await api.createProject(payload)
        navigate(`/project/${assessmentId}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const panels = [
    // 0: 基础信息
    <div key="basic" className="grid grid-cols-2 gap-4">
      <Field label="项目名称 *">
        <Input value={basic.projectName} onChange={e => setBasic(p => ({ ...p, projectName: e.target.value }))} placeholder="如：Singapore-Jakarta WAPS Assessment" />
      </Field>
      <Field label="客户名称">
        <Input value={basic.clientName} onChange={e => setBasic(p => ({ ...p, clientName: e.target.value }))} />
      </Field>
    </div>,

    // 1: 船舶
    <div key="vessel" className="grid grid-cols-3 gap-4">
      <Field label="船名"><Input value={vessel.vesselName} onChange={e => setVessel(p => ({ ...p, vesselName: e.target.value }))} /></Field>
      <Field label="船舶类型 *">
        <Select value={vessel.vesselType} onChange={e => setVessel(p => ({ ...p, vesselType: e.target.value }))}>
          <option value="bulk_carrier">散货船</option>
          <option value="tanker">油船</option>
          <option value="container">集装箱船</option>
          <option value="general_cargo">通用货船</option>
          <option value="offshore_support">海上支持船</option>
          <option value="research">科考船</option>
          <option value="ferry">渡轮</option>
          <option value="other">其他</option>
        </Select>
      </Field>
      <Field label="船旗国"><Input value={vessel.flag} onChange={e => setVessel(p => ({ ...p, flag: e.target.value }))} /></Field>
      <Field label="船级社">
        <Select value={vessel.classSociety} onChange={e => setVessel(p => ({ ...p, classSociety: e.target.value }))}>
          <option value="DNV">DNV</option><option value="ABS">ABS</option><option value="LR">LR</option>
          <option value="BV">BV</option><option value="ClassNK">ClassNK</option><option value="CCS">CCS</option>
          <option value="KR">KR</option><option value="Other">其他</option>
        </Select>
      </Field>
      <Field label="建造年份"><Input type="number" value={vessel.yearBuilt} onChange={e => setVessel(p => ({ ...p, yearBuilt: e.target.value }))} /></Field>
      <Field label="总长 LOA (m) *"><Input type="number" value={vessel.loaM} onChange={e => setVessel(p => ({ ...p, loaM: e.target.value }))} /></Field>
      <Field label="型宽 (m) *"><Input type="number" value={vessel.beamM} onChange={e => setVessel(p => ({ ...p, beamM: e.target.value }))} /></Field>
      <Field label="设计吃水 (m)"><Input type="number" value={vessel.draftM} onChange={e => setVessel(p => ({ ...p, draftM: e.target.value }))} /></Field>
      <Field label="载重吨 DWT (t)"><Input type="number" value={vessel.dwtT} onChange={e => setVessel(p => ({ ...p, dwtT: e.target.value }))} /></Field>
      <Field label="总吨 GT"><Input type="number" value={vessel.grossTonnage} onChange={e => setVessel(p => ({ ...p, grossTonnage: e.target.value }))} /></Field>
      <Field label="服务航速 (kn) *"><Input type="number" step="0.1" value={vessel.serviceSpeedKn} onChange={e => setVessel(p => ({ ...p, serviceSpeedKn: e.target.value }))} /></Field>
      <Field label="主机功率 (kW)"><Input type="number" value={vessel.mainEnginePowerKw} onChange={e => setVessel(p => ({ ...p, mainEnginePowerKw: e.target.value }))} /></Field>
    </div>,

    // 2: 航线
    <div key="route" className="grid grid-cols-2 gap-4">
      <Field label="航线名称"><Input value={route.routeName} onChange={e => setRoute(p => ({ ...p, routeName: e.target.value }))} /></Field>
      <Field label="出发港"><Input value={route.originPort} onChange={e => setRoute(p => ({ ...p, originPort: e.target.value }))} /></Field>
      <Field label="目的港"><Input value={route.destinationPort} onChange={e => setRoute(p => ({ ...p, destinationPort: e.target.value }))} /></Field>
      <Field label="航线距离 (海里)"><Input type="number" value={route.routeDistanceNm} onChange={e => setRoute(p => ({ ...p, routeDistanceNm: e.target.value }))} /></Field>
      <Field label="年航次"><Input type="number" value={route.voyageCountPerYear} onChange={e => setRoute(p => ({ ...p, voyageCountPerYear: e.target.value }))} /></Field>
      <Field label="季节性模式">
        <Select value={route.seasonalPattern} onChange={e => setRoute(p => ({ ...p, seasonalPattern: e.target.value }))}>
          <option value="monsoon">季风型</option><option value="non_monsoon">非季风型</option>
          <option value="mixed">混合型</option><option value="unknown">未知</option>
        </Select>
      </Field>
      <Field label="是否停靠欧盟港口">
        <Select value={route.callsEuPorts} onChange={e => setRoute(p => ({ ...p, callsEuPorts: e.target.value }))}>
          <option value="false">否</option><option value="true">是</option>
        </Select>
      </Field>
    </div>,

    // 3: 燃油
    <div key="fuel" className="grid grid-cols-2 gap-4">
      <Field label="燃油类型">
        <Select value={fuel.fuelType} onChange={e => setFuel(p => ({ ...p, fuelType: e.target.value }))}>
          <option value="VLSFO">VLSFO</option><option value="HFO">HFO</option>
          <option value="MGO">MGO</option><option value="LNG">LNG</option>
        </Select>
      </Field>
      <Field label="年燃油消耗 (t)"><Input type="number" value={fuel.annualFuelConsumptionT} onChange={e => setFuel(p => ({ ...p, annualFuelConsumptionT: e.target.value }))} /></Field>
      <Field label="燃油价格 (USD/t)"><Input type="number" value={fuel.fuelPriceUsdPerT} onChange={e => setFuel(p => ({ ...p, fuelPriceUsdPerT: e.target.value }))} /></Field>
      <Field label="年运营天数"><Input type="number" value={fuel.annualOperatingDays} onChange={e => setFuel(p => ({ ...p, annualOperatingDays: e.target.value }))} /></Field>
    </div>,

    // 4: 气象
    <div key="weather" className="grid grid-cols-2 gap-4">
      <Field label="平均真风速 (m/s)"><Input type="number" step="0.1" value={weather.averageTrueWindSpeedMs} onChange={e => setWeather(p => ({ ...p, averageTrueWindSpeedMs: e.target.value }))} /></Field>
      <Field label="有利风向占比 (%)"><Input type="number" min="0" max="100" value={weather.favorableWindPercentage} onChange={e => setWeather(p => ({ ...p, favorableWindPercentage: e.target.value }))} /></Field>
      <Field label="季节性变化程度">
        <Select value={weather.seasonalVariability} onChange={e => setWeather(p => ({ ...p, seasonalVariability: e.target.value }))}>
          <option value="low">低</option><option value="medium">中</option>
          <option value="high">高</option><option value="unknown">未知</option>
        </Select>
      </Field>
    </div>,

    // 5: 甲板
    <div key="deck" className="grid grid-cols-2 gap-4">
      <Field label="可用甲板面积 (m²)"><Input type="number" value={deck.availableDeckAreaM2} onChange={e => setDeck(p => ({ ...p, availableDeckAreaM2: e.target.value }))} /></Field>
      <Field label="最大安装高度 (m)"><Input type="number" value={deck.maxAllowableInstallationHeightM} onChange={e => setDeck(p => ({ ...p, maxAllowableInstallationHeightM: e.target.value }))} /></Field>
      <Field label="与货物装卸冲突">
        <Select value={deck.cargoOperationConflict} onChange={e => setDeck(p => ({ ...p, cargoOperationConflict: e.target.value }))}>
          <option value="none">无</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="unknown">未知</option>
        </Select>
      </Field>
      <Field label="与吊机作业冲突">
        <Select value={deck.craneOperationConflict} onChange={e => setDeck(p => ({ ...p, craneOperationConflict: e.target.value }))}>
          <option value="none">无</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="unknown">未知</option>
        </Select>
      </Field>
      <Field label="对驾驶台视线影响">
        <Select value={deck.bridgeVisibilityImpact} onChange={e => setDeck(p => ({ ...p, bridgeVisibilityImpact: e.target.value }))}>
          <option value="none">无</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="unknown">未知</option>
        </Select>
      </Field>
    </div>,

    // 6: 稳性
    <div key="stability" className="grid grid-cols-2 gap-4">
      <Field label="GM 值 (m)"><Input type="number" step="0.01" value={stability.gmM} onChange={e => setStability(p => ({ ...p, gmM: e.target.value }))} /></Field>
      <Field label="最大允许附加重量 (t)"><Input type="number" value={stability.maxAllowableAdditionalWeightT} onChange={e => setStability(p => ({ ...p, maxAllowableAdditionalWeightT: e.target.value }))} /></Field>
      <Field label="甲板载荷限制 (t/m²)"><Input type="number" step="0.1" value={stability.deckLoadLimitTPerM2} onChange={e => setStability(p => ({ ...p, deckLoadLimitTPerM2: e.target.value }))} /></Field>
      <Field label="稳性手册可用">
        <Select value={stability.stabilityBookletAvailable} onChange={e => setStability(p => ({ ...p, stabilityBookletAvailable: e.target.value }))}>
          <option value="false">否</option><option value="true">是</option>
        </Select>
      </Field>
      <Field label="结构图纸可用">
        <Select value={stability.structuralDrawingsAvailable} onChange={e => setStability(p => ({ ...p, structuralDrawingsAvailable: e.target.value }))}>
          <option value="false">否</option><option value="true">是</option>
        </Select>
      </Field>
      <Field label="倾斜试验数据可用">
        <Select value={stability.incliningTestDataAvailable} onChange={e => setStability(p => ({ ...p, incliningTestDataAvailable: e.target.value }))}>
          <option value="false">否</option><option value="true">是</option>
        </Select>
      </Field>
    </div>,

    // 7: 运营
    <div key="operation" className="grid grid-cols-2 gap-4">
      <Field label="年运营天数"><Input type="number" value={operation.annualOperatingDays} onChange={e => setOperation(p => ({ ...p, annualOperatingDays: e.target.value }))} /></Field>
      <Field label="货物作业类型">
        <Select value={operation.cargoOperationType} onChange={e => setOperation(p => ({ ...p, cargoOperationType: e.target.value }))}>
          <option value="bulk">散货</option><option value="container">集装箱</option>
          <option value="liquid">液体</option><option value="deck_cargo">甲板货</option>
          <option value="passenger">旅客</option><option value="other">其他</option>
        </Select>
      </Field>
      <Field label="船员技能水平">
        <Select value={operation.crewSkillLevel} onChange={e => setOperation(p => ({ ...p, crewSkillLevel: e.target.value }))}>
          <option value="high">高</option><option value="medium">中</option><option value="low">低</option><option value="unknown">未知</option>
        </Select>
      </Field>
      <Field label="航期敏感性">
        <Select value={operation.scheduleSensitivity} onChange={e => setOperation(p => ({ ...p, scheduleSensitivity: e.target.value }))}>
          <option value="high">高</option><option value="medium">中</option><option value="low">低</option><option value="unknown">未知</option>
        </Select>
      </Field>
      <Field label="保险顾虑程度">
        <Select value={operation.insuranceConcernLevel} onChange={e => setOperation(p => ({ ...p, insuranceConcernLevel: e.target.value }))}>
          <option value="high">高</option><option value="medium">中</option><option value="low">低</option><option value="unknown">未知</option>
        </Select>
      </Field>
      <Field label="港口限制程度">
        <Select value={operation.portRestrictionLevel} onChange={e => setOperation(p => ({ ...p, portRestrictionLevel: e.target.value }))}>
          <option value="high">高</option><option value="medium">中</option><option value="low">低</option><option value="unknown">未知</option>
        </Select>
      </Field>
    </div>,

    // 8: 政策
    <div key="policy" className="grid grid-cols-2 gap-4">
      {([
        ['imoCiiApplicable', 'IMO CII 适用'],
        ['eexiApplicable', 'IMO EEXI 适用'],
        ['seempApplicable', 'SEEMP 适用'],
        ['fuelEuApplicable', 'FuelEU Maritime 适用'],
        ['euEtsApplicable', 'EU ETS 适用'],
        ['esgReportingRequired', 'ESG 披露要求'],
        ['greenFinanceInterest', '绿色金融兴趣'],
        ['domesticGreenShippingProgram', '国内绿色航运计划'],
      ] as [keyof typeof policy, string][]).map(([key, label]) => (
        <Field key={key} label={label}>
          <Select value={policy[key]} onChange={e => setPolicy(p => ({ ...p, [key]: e.target.value }))}>
            <option value="false">否</option><option value="true">是</option>
          </Select>
        </Field>
      ))}
    </div>,
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载数据中…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(isEdit && id ? `/project/${id}` : '/')} className="text-gray-500 hover:text-gray-800 text-sm">← 返回</button>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold text-gray-900">{isEdit ? '编辑评估数据' : '新建 WAPS 评估'}</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
            {TABS.map((t, i) => (
              <button
                key={i}
                onClick={() => setTab(i)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${tab === i ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-6">{panels[tab]}</div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              disabled={tab === 0}
              onClick={() => setTab(t => t - 1)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30"
            >
              ← 上一步
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {tab < TABS.length - 1 ? (
              <button onClick={() => setTab(t => t + 1)} className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                下一步 →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60">
                {submitting ? '提交中…' : isEdit ? '保存修改' : '创建评估'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
