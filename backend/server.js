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
// helmet is set to not interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: false,
}))

// CORS — must be before all routes
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    console.log('CORS blocked origin:', origin)
    console.log('Allowed origins:', allowedOrigins)
    return callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Handle preflight OPTIONS requests globally
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`Lost & Found backend running on port ${PORT}`)
  console.log('Allowed origins:', allowedOrigins)
})
