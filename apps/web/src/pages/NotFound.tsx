import { useNavigate } from 'react-router-dom'

export function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
      <div className="text-7xl mb-6">⚓</div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">页面未找到</h1>
      <p className="text-slate-500 mb-8">您访问的页面不存在或已被移除</p>
      <button
        onClick={() => navigate('/')}
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
      >
        返回项目列表
      </button>
    </div>
  )
}
