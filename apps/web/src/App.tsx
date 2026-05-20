import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'
import { Layout } from './components/Layout'
import { ToastContainer } from './components/Toast'
import { ProjectList } from './pages/ProjectList'
import { DataEntry } from './pages/DataEntry'
import { ProjectDetail } from './pages/ProjectDetail'
import { ReportPage } from './pages/ReportPage'
import { NotFound } from './pages/NotFound'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/new" element={<DataEntry />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/project/:id/edit" element={<DataEntry />} />
            <Route path="/project/:id/report" element={<ReportPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
