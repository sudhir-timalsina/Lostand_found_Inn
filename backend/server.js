import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import itemsRouter from './routes/items.js'
import scanRouter from './routes/scan.js'

const app = express()
const PORT = process.env.PORT || 5500

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})

const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scan requests. Please try again later.' },
})

// Routes
app.use('/api/items', itemsRouter)

// Scan routes — POST gets rate limited
app.use('/api/scan', (req, res, next) => {
  if (req.method === 'POST') return scanLimiter(req, res, next)
  next()
}, scanRouter)

// Auth rate limiter placeholder
app.use('/api/auth', authLimiter)

// Health check
app.get('/health', (req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Lost & Found backend running on port ${PORT}`)
})
