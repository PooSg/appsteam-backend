const express = require('express')
const router = express.Router()
const db = require('../config/db')
const auth = require('../middleware/auth')

// Get wishlist
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT w.*, g.title, g.price, g.cover_image, g.genre FROM WISHLIST w JOIN GAME g ON w.game_id = g.game_id WHERE w.user_id = ?',
      [req.user.user_id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Add to wishlist
router.post('/', auth, async (req, res) => {
  try {
    const { game_id } = req.body
    await db.query('INSERT IGNORE INTO WISHLIST (user_id, game_id) VALUES (?, ?)', [req.user.user_id, game_id])
    res.json({ message: 'Added to wishlist' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Remove from wishlist
router.delete('/:game_id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM WISHLIST WHERE user_id = ? AND game_id = ?', [req.user.user_id, req.params.game_id])
    res.json({ message: 'Removed from wishlist' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router