import { Link, useLocation } from 'react-router-dom'

export function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const onList = loc.pathname === '/'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
            <span className="text-2xl">⛵</span>
            <div className="leading-tight">
              <span className="font-bold text-sm tracking-wide">WAPS</span>
              <span className="text-slate-400 text-xs ml-1">评估系统</span>
            </div>
          </Link>

          <div className="h-5 w-px bg-slate-700 mx-1" />

          <nav className="flex items-center gap-1 flex-1 text-sm">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md transition-colors ${onList ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              项目列表
            </Link>
          </nav>

          <Link
            to="/new"
            className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition-colors"
          >
            + 新建评估
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white text-xs text-slate-400 text-center py-3">
        WAPS 船舶风能辅助改造适配评估系统 · 仅供参考，不构成正式工程建议
      </footer>
    </div>
  )
}
