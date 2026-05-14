const express = require('express')
const cors    = require('cors')
require('dotenv').config()

const app = express()

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: true,
}))
app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'))
app.use('/api/games',  require('./routes/games'))
app.use('/api/cart',   require('./routes/cart'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/users',  require('./routes/users'))

app.use('/api/wishlist', require('./routes/wishlist'))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Appsteam API is running!' })
})

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅  Appsteam API running on http://localhost:${PORT}`)
})
