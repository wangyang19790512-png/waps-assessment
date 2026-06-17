import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api, type FullResult } from '../api'

const API_BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'
import { toast } from '../components/Toast'

const RATING_CONFIG: Record<string, { bg: string; ring: string; label: string }> = {
  A: { bg: 'bg-emerald-500', ring: 'ring-emerald-300', label: '强烈推荐' },
  B: { bg: 'bg-blue-500',    ring: 'ring-blue-300',    label: '建议推进' },
  C: { bg: 'bg-amber-400',   ring: 'ring-amber-300',   label: '有条件推进' },
  D: { bg: 'bg-orange-500',  ring: 'ring-orange-300',  label: '仅供研究' },
  E: { bg: 'bg-red-500',     ring: 'ring-red-300',     label: '不建议' },
}

const WAPS_NAME: Record<string, string> = {
  rotor_sail: '转子帆', rigid_wing_sail: '硬翼帆',
  suction_wing: '吸力翼', soft_sail: '软帆',
  kite_system: '风筝系统', not_recommended: '暂不推荐',
}

const RECOMMENDATION_LABEL: Record<string, string> = {
  proceed_to_detailed_design: '建议推进详细设计',
  proceed_with_data_collection: '建议先补充数据',
  research_only: '仅作研究参考，暂不建议商业改造',
  not_recommended: '不建议改造',
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high:     'bg-orange-100 text-orange-800 border-orange-200',
  medium:   'bg-amber-100 text-amber-800 border-amber-200',
  low:      'bg-blue-100 text-blue-800 border-blue-200',
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: '严重', high: '高', medium: '中', low: '低',
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  immediate:        { color: 'bg-red-100 text-red-700 border-red-200',    label: '立即' },
  short_term:       { color: 'bg-amber-100 text-amber-700 border-amber-200', label: '近期' },
  before_next_stage:{ color: 'bg-blue-100 text-blue-700 border-blue-200', label: '下阶段前' },
}

function ScoreDimension({ label, score, weight }: { label: string; score: number; weight: string }) {
  const pct = Math.min(score, 100)
  const color = score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-500'
  const textColor = score >= 70 ? 'text-emerald-700' : score >= 50 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-xs text-slate-400 ml-1">({weight})</span>
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${textColor}`}>{score}</span>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

interface AgentProgress { agentName: string; index: number; total: number; done: boolean }

type TabKey = 'scores' | 'risks' | 'actions' | 'agents'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<FullResult | null>(null)
  const [running, setRunning] = useState(false)
  const [tab, setTab] = useState<TabKey>('scores')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [agentProgress, setAgentProgress] = useState<AgentProgress | null>(null)

  useEffect(() => {
    if (!id) return
    api.getResults(id).then(setResult).catch((e: Error) => {
      if (!e.message.includes('Results not found')) toast.error('加载评估结果失败')
    })
  }, [id])

  async function runAssessment() {
    if (!id) return
    setRunning(true)
    try {
      await api.runAssessment(id)
      const r = await api.getResults(id)
      setResult(r)
      toast.success(`评估完成，综合得分 ${r.totalScore} / ${r.rating}级`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '评估失败')
    } finally {
      setRunning(false)
    }
  }

  function runWithAgents() {
    if (!id) return
    setAgentProgress({ agentName: '启动中…', index: 0, total: 10, done: false })
    setTab('agents')

    fetch(`${API_BASE}/assessments/${id}/run-with-agents`, { method: 'POST' })
      .then(async res => {
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: 'Failed' }))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const parts = buf.split('\n\n')
          buf = parts.pop() ?? ''
          for (const part of parts) {
            const eventLine = part.match(/^event: (.+)$/m)?.[1]
            const dataLine = part.match(/^data: (.+)$/m)?.[1]
            if (!dataLine) continue
            try {
              const data = JSON.parse(dataLine)
              if (eventLine === 'agent_progress') {
                setAgentProgress({ agentName: data.agentName, index: data.index, total: data.total, done: false })
              } else if (eventLine === 'done') {
                setAgentProgress(p => p ? { ...p, done: true } : null)
                const r = await api.getResults(id)
                setResult(r)
                toast.success(`AI 分析完成，共 ${r.agentSummaries.length} 个模块`)
              } else if (eventLine === 'error') {
                throw new Error(data.message)
              }
            } catch { /* parse errors */ }
          }
        }
      })
      .catch(e => {
        toast.error(e instanceof Error ? e.message : 'AI 分析失败')
        setAgentProgress(null)
      })
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    try {
      await api.deleteProject(id)
      toast.success('项目已删除')
      navigate('/')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const rc = result ? RATING_CONFIG[result.rating] : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-800">项目列表</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">项目详情</span>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/project/${id}/edit`)}
            className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
          >
            编辑数据
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            删除项目
          </button>
        </div>

        <div className="flex gap-2">
          {result && (
            <>
              <button
                onClick={runWithAgents}
                disabled={agentProgress !== null && !agentProgress.done}
                className="px-4 py-2 text-sm border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition-colors"
              >
                ✦ AI 深度分析
              </button>
              <Link
                to={`/project/${id}/report`}
                className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                查看报告 →
              </Link>
            </>
          )}
          <button
            onClick={runAssessment}
            disabled={running}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-60 transition-colors font-medium"
          >
            {running ? '计算中…' : result ? '重新运行' : '运行评估'}
          </button>
        </div>
      </div>

      {/* No result state */}
      {!result && !running && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">尚未运行评估</h2>
          <p className="text-slate-400 text-sm mb-6">填写完船舶数据后，点击右上角「运行评估」开始计算</p>
          <button onClick={runAssessment} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-500 font-medium text-sm">
            立即运行评估
          </button>
        </div>
      )}

      {running && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="text-4xl mb-4 animate-spin inline-block">⚙</div>
          <p className="text-slate-600">评估计算中，请稍候…</p>
        </div>
      )}

      {result && rc && (
        <div className="space-y-5">
          {/* Summary hero card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className={`${rc.bg} px-6 py-4`}>
              <div className="flex items-center gap-5">
                <div className={`ring-4 ${rc.ring} rounded-2xl w-20 h-20 flex flex-col items-center justify-center bg-white/20`}>
                  <span className="text-4xl font-black text-white">{result.rating}</span>
                </div>
                <div className="text-white">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">{result.totalScore}</span>
                    <span className="text-white/70 text-lg">/ 100</span>
                  </div>
                  <p className="font-semibold mt-0.5">{rc.label}</p>
                  <p className="text-white/80 text-sm mt-0.5">{RECOMMENDATION_LABEL[result.recommendation]}</p>
                </div>
                <div className="ml-auto text-right text-white">
                  <p className="text-sm text-white/70">推荐 WAPS 技术</p>
                  <p className="text-xl font-bold">{WAPS_NAME[result.recommendedWapsType]}</p>
                  {result.alternativeWapsTypes.length > 0 && (
                    <p className="text-white/70 text-xs mt-1">
                      备选：{result.alternativeWapsTypes.slice(0, 2).map(t => WAPS_NAME[t]).join('、')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Key metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
              {[
                { label: '年节油量（中性）', value: `${result.fuelSaving.baseFuelSavingT} t`, sub: `${(result.fuelSaving.baseRate * 100).toFixed(1)}% 节油率` },
                { label: '年CO₂减排（中性）', value: `${result.co2Reduction.baseCo2ReductionT} t`, sub: '排放因子 3.114 tCO₂/t燃油' },
                { label: '基准CAPEX', value: `$${(result.economics.capexBaseUsd / 1_000_000).toFixed(1)}M`, sub: `区间 $${(result.economics.capexLowUsd / 1e6).toFixed(1)}M–$${(result.economics.capexHighUsd / 1e6).toFixed(1)}M` },
                { label: '投资回收期（乐观）', value: result.economics.paybackYearsOptimistic != null ? `${result.economics.paybackYearsOptimistic.toFixed(1)} 年` : '无法回收', sub: `年节省燃油成本 $${(result.economics.annualFuelCostSavingBaseUsd / 1000).toFixed(0)}k` },
              ].map(m => (
                <div key={m.label} className="px-5 py-4">
                  <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                  <p className="text-lg font-bold text-slate-900">{m.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detail section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50">
              {([
                ['scores', '维度评分'],
                ['risks',  `风险清单${result.risks.length > 0 ? ` (${result.risks.length})` : ''}`],
                ['actions',`行动建议${result.nextActions.length > 0 ? ` (${result.nextActions.length})` : ''}`],
                ['agents', `AI 分析${result.agentSummaries.length > 0 ? ` (${result.agentSummaries.length})` : ''}`],
              ] as [TabKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${tab === key ? 'border-b-2 border-blue-600 text-blue-700 bg-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === 'scores' && (
                <div>
                  <div className="space-y-3 mb-6">
                    <ScoreDimension label="船型适配"    score={result.scores.vesselSuitability}   weight="20%" />
                    <ScoreDimension label="航线风资源"  score={result.scores.routeWind}            weight="20%" />
                    <ScoreDimension label="经济可行性"  score={result.scores.economic}             weight="20%" />
                    <ScoreDimension label="航运运营影响" score={result.scores.shippingOperation}   weight="15%" />
                    <ScoreDimension label="船级社风险"  score={result.scores.classRisk}            weight="10%" />
                    <ScoreDimension label="稳性与结构"  score={result.scores.stabilityStructure}   weight="10%" />
                    <ScoreDimension label="政策合规价值" score={result.scores.policyCompliance}    weight="5%" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                    <StatCard label="节油率区间" value={`${(result.fuelSaving.conservativeRate * 100).toFixed(1)}%–${(result.fuelSaving.optimisticRate * 100).toFixed(1)}%`} sub="保守→乐观" />
                    <StatCard label="数据完整性" value={`${result.dataCompleteness.score} / 100`} sub={result.dataCompleteness.level === 'high' ? '高（可生成报告）' : result.dataCompleteness.level === 'medium' ? '中（建议补充数据）' : '低（关键数据缺失）'} />
                    <StatCard label="年度运维成本" value={`$${(result.economics.annualOpexUsd / 1000).toFixed(0)}k`} sub="WAPS系统维护费用/年" />
                  </div>
                </div>
              )}

              {tab === 'risks' && (
                <div className="space-y-3">
                  {result.risks.length === 0 && (
                    <p className="text-slate-400 text-sm py-4 text-center">暂无识别风险</p>
                  )}
                  {result.risks.map(r => (
                    <div key={r.id} className={`flex gap-3 p-4 rounded-xl border ${SEVERITY_COLOR[r.severity]}`}>
                      <div className="shrink-0 mt-0.5">
                        <span className="text-xs font-bold">[{r.id}]</span>
                        <span className="ml-1 text-xs">{SEVERITY_LABEL[r.severity]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{r.description}</p>
                        <p className="text-xs opacity-75 mt-1">↳ 缓解：{r.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'actions' && (
                <div className="space-y-3">
                  {result.nextActions.length === 0 && (
                    <p className="text-slate-400 text-sm py-4 text-center">暂无行动建议</p>
                  )}
                  {result.nextActions.map((a, i) => {
                    const pc = PRIORITY_CONFIG[a.priority] ?? PRIORITY_CONFIG.before_next_stage
                    return (
                      <div key={i} className={`flex gap-3 p-4 rounded-xl border ${pc.color}`}>
                        <span className="text-xs font-bold shrink-0 mt-0.5">{pc.label}</span>
                        <div>
                          <p className="text-sm">{a.action}</p>
                          <p className="text-xs opacity-70 mt-1">责任方：{a.responsible}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {tab === 'agents' && (
                <div>
                  {agentProgress && !agentProgress.done && (
                    <div className="mb-5 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-purple-800">AI 分析进行中</span>
                        <span className="text-purple-500">{agentProgress.index} / {agentProgress.total}</span>
                      </div>
                      <div className="bg-purple-100 rounded-full h-1.5 mb-2">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${(agentProgress.index / agentProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-purple-600">当前：{agentProgress.agentName}</p>
                    </div>
                  )}

                  {result.agentSummaries.length === 0 && !agentProgress ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">✦</div>
                      <p className="font-medium text-slate-600 mb-1">AI 深度分析尚未生成</p>
                      <p className="text-sm text-slate-400 mb-5">
                        点击下方按钮，使用 AI 对各维度进行深度解读
                      </p>
                      <button onClick={runWithAgents} className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-purple-500 transition-colors">
                        ✦ 开始 AI 深度分析
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {result.agentSummaries.map((s, i) => (
                        <div key={i} className="border border-slate-100 rounded-xl p-4 hover:border-purple-200 transition-colors">
                          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            <span className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                            {s.agentName}
                          </h3>
                          <p className="text-sm text-slate-700 leading-relaxed mb-3">{s.summary}</p>
                          {s.keyFindings.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">关键发现</p>
                              <ul className="space-y-1">
                                {s.keyFindings.map((f, j) => (
                                  <li key={j} className="text-sm text-slate-600 flex gap-2"><span className="text-slate-400 shrink-0">·</span>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {s.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">建议</p>
                              <ul className="space-y-1">
                                {s.recommendations.map((r, j) => (
                                  <li key={j} className="text-sm text-slate-600 flex gap-2"><span className="text-emerald-500 shrink-0">→</span>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">确认删除项目</h3>
            <p className="text-slate-500 text-sm mb-5">将同时删除该项目的评估结果和报告文件，此操作不可撤销。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-60"
              >
                {deleting ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
