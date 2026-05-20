import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8">
            <p className="text-4xl mb-4">⚠️</p>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">页面出现错误</h2>
            <p className="text-sm text-gray-500 mb-5">{this.state.error.message}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
