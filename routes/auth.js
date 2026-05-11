const express = require('express')
const router  = express.Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const db      = require('../config/db')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields are required' })

  try {
    // Check if email already exists
    const [existing] = await db.query('SELECT user_id FROM USER WHERE email = ?', [email])
    if (existing.length > 0)
      return res.status(400).json({ message: 'Email already registered' })

    // Hash password
    const hash = await bcrypt.hash(password, 10)

    // Insert user
    const [result] = await db.query(
      'INSERT INTO USER (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hash]
    )

    // Create a cart for the new user
    await db.query('INSERT INTO CART (user_id) VALUES (?)', [result.insertId])

    res.status(201).json({ message: 'Account created successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' })

  try {
    const [rows] = await db.query('SELECT * FROM USER WHERE email = ?', [email])
    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid email or password' })

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' })

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        user_id:  user.user_id,
        username: user.username,
        email:    user.email,
        role:     user.role,
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
