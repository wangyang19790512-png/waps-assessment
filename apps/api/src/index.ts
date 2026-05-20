import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { assessmentsRouter } from './routes/assessments.js'

const _dir = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.use('/api/assessments', assessmentsRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' })
})

// Serve React frontend in production
const webDist = join(_dir, '..', '..', 'web', 'dist')
if (existsSync(webDist)) {
  app.use(express.static(webDist))
  app.get('*', (_req, res) => {
    res.sendFile(join(webDist, 'index.html'))
  })
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })
}

app.listen(PORT, () => {
  console.log(`WAPS API server running on http://localhost:${PORT}`)
})

export default app
