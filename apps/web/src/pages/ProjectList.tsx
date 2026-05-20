import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type ProjectSummary } from '../api'

const RATING_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-emerald-500', text: 'text-white', label: '强烈推荐' },
  B: { bg: 'bg-blue-500',    text: 'text-white', label: '建议推进' },
  C: { bg: 'bg-amber-400',   text: 'text-white', label: '有条件推进' },
  D: { bg: 'bg-orange-500',  text: 'text-white', label: '仅供研究' },
  E: { bg: 'bg-red-500',     text: 'text-white', label: '不建议' },
}

function ProjectCard({ p, onClick }: { p: ProjectSummary & { rating?: string; totalScore?: number }; onClick: () => void }) {
  const rating = p.rating
  const rs = rating ? RATING_STYLE[rating] : null

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
              {p.projectName}
            </h2>
            {(p.clientName || p.vesselName) && (
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {[p.clientName, p.vesselName].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {rs && p.totalScore !== undefined && (
              <div className={`${rs.bg} ${rs.text} rounded-lg px-2.5 py-1 text-center`}>
                <div className="text-lg font-bold leading-none">{p.totalScore}</div>
                <div className="text-xs opacity-80 mt-0.5">{rating}级</div>
              </div>
            )}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
              {p.status === 'completed' ? '已完成' : '草稿'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          更新于 {new Date(p.updatedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

export function ProjectList() {
  const [projects, setProjects] = useState<(ProjectSummary & { rating?: string; totalScore?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.listProjects()
      .then(async list => {
        // Attach score/rating for completed projects
        const enriched = await Promise.all(list.map(async p => {
          if (p.status !== 'completed') return p
          try {
            const r = await api.getResults(p.assessmentId)
            return { ...p, rating: r.rating, totalScore: r.totalScore }
          } catch {
            return p
          }
        }))
        setProjects(enriched)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p =>
    !search || p.projectName.toLowerCase().includes(search.toLowerCase()) ||
    p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    p.vesselName?.toLowerCase().includes(search.toLowerCase())
  )

  const completedCount = projects.filter(p => p.status === 'completed').length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">评估项目</h1>
        {!loading && (
          <p className="text-slate-500 text-sm mt-1">
            共 {projects.length} 个项目，{completedCount} 个已完成评估
          </p>
        )}
      </div>

      {/* Search + action bar */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索项目名称、客户、船名…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <button
          onClick={() => navigate('/new')}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors shrink-0"
        >
          + 新建评估
        </button>
      </div>

      {/* States */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
          ⚠ 加载失败：{error}。请确认 API 服务器已启动。
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <div className="text-6xl mb-4">⛵</div>
          {search ? (
            <p>未找到匹配 "<strong className="text-slate-600">{search}</strong>" 的项目</p>
          ) : (
            <>
              <p className="text-lg font-medium text-slate-600">暂无评估项目</p>
              <p className="text-sm mt-1">点击右上角「新建评估」开始第一个项目</p>
              <button
                onClick={() => navigate('/new')}
                className="mt-5 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                + 新建评估
              </button>
            </>
          )}
        </div>
      )}

      <div className="grid gap-3">
        {filtered.map(p => (
          <ProjectCard
            key={p.assessmentId}
            p={p}
            onClick={() => navigate(`/project/${p.assessmentId}`)}
          />
        ))}
      </div>
    </div>
  )
}
