const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const auth    = require('../middleware/auth')
const admin   = require('../middleware/admin')

// GET /api/games  — public, supports ?genre= and ?search=
router.get('/', async (req, res) => {
  const { genre, search } = req.query
  let sql    = 'SELECT * FROM GAME WHERE 1=1'
  const params = []

  if (genre) {
    sql += ' AND genre LIKE ?'
    params.push(`%${genre}%`)
  }
  if (search) {
    sql += ' AND title LIKE ?'
    params.push(`%${search}%`)
  }

  sql += ' ORDER BY created_at DESC'

  try {
    const [rows] = await db.query(sql, params)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/games/:id  — public
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM GAME WHERE game_id = ?', [req.params.id])
    if (rows.length === 0)
      return res.status(404).json({ message: 'Game not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/games  — admin only
router.post('/', auth, admin, async (req, res) => {
  const { title, description, price, genre, cover_image, stock } = req.body
  if (!title || !price)
    return res.status(400).json({ message: 'Title and price are required' })

  try {
    const [result] = await db.query(
      'INSERT INTO GAME (title, description, price, genre, cover_image, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description || null, price, genre || null, cover_image || null, stock || 0]
    )
    const [rows] = await db.query('SELECT * FROM GAME WHERE game_id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// PUT /api/games/:id  — admin only
router.put('/:id', auth, admin, async (req, res) => {
  const { title, description, price, genre, cover_image, stock } = req.body

  try {
    const [check] = await db.query('SELECT game_id FROM GAME WHERE game_id = ?', [req.params.id])
    if (check.length === 0)
      return res.status(404).json({ message: 'Game not found' })

    await db.query(
      'UPDATE GAME SET title=?, description=?, price=?, genre=?, cover_image=?, stock=? WHERE game_id=?',
      [title, description || null, price, genre || null, cover_image || null, stock, req.params.id]
    )
    const [rows] = await db.query('SELECT * FROM GAME WHERE game_id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/games/:id  — admin only
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const [check] = await db.query('SELECT game_id FROM GAME WHERE game_id = ?', [req.params.id])
    if (check.length === 0)
      return res.status(404).json({ message: 'Game not found' })

    await db.query('DELETE FROM GAME WHERE game_id = ?', [req.params.id])
    res.json({ message: 'Game deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
