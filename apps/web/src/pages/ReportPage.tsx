import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Markdown from 'react-markdown'
import { api } from '../api'

export function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.getReport(id)
      .then(r => setMarkdown(r.reportMarkdown))
      .catch(() => setMarkdown(''))
      .finally(() => setLoading(false))
  }, [id])

  async function generate() {
    if (!id) return
    setGenerating(true); setError('')
    try {
      const r = await api.generateReport(id)
      setMarkdown(r.reportMarkdown)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  function downloadMd() {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waps-report-${id}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate(`/project/${id}`)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← 返回详情
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-medium">评估报告</span>
        </div>
        <div className="flex gap-2">
          {markdown && (
            <button
              onClick={downloadMd}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              ↓ 下载 .md
            </button>
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-60 font-medium transition-colors"
          >
            {generating ? '生成中…' : markdown ? '重新生成' : '生成报告'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">
          ⚠ {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="text-slate-400 text-sm animate-pulse">加载中…</div>
        </div>
      )}

      {!loading && !markdown && !generating && (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="text-5xl mb-4">📄</div>
          <p className="text-slate-500 mb-2 font-medium">报告尚未生成</p>
          <p className="text-slate-400 text-sm mb-6">点击下方按钮，使用 AI 自动生成完整 Markdown 评估报告</p>
          <button
            onClick={generate}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-500 font-medium transition-colors"
          >
            生成评估报告
          </button>
        </div>
      )}

      {generating && (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="text-5xl mb-4 animate-bounce">✍️</div>
          <p className="text-slate-600 font-medium">AI 正在撰写报告，请稍候…</p>
          <p className="text-slate-400 text-sm mt-1">通常需要 10–30 秒</p>
        </div>
      )}

      {markdown && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 prose prose-slate prose-sm max-w-none">
          <Markdown>{markdown}</Markdown>
        </div>
      )}
    </div>
  )
}
