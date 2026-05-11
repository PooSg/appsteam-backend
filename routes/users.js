const express = require('express')
const router  = express.Router()
const bcrypt  = require('bcryptjs')
const db      = require('../config/db')
const auth    = require('../middleware/auth')

// GET /api/users/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, username, email, role, profile_pic, created_at FROM USER WHERE user_id = ?',
      [req.user.user_id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// PUT /api/users/profile  — update username/email or change password
router.put('/profile', auth, async (req, res) => {
  const { username, email, current_password, new_password } = req.body

  try {
    const [rows] = await db.query('SELECT * FROM USER WHERE user_id = ?', [req.user.user_id])
    if (rows.length === 0)
      return res.status(404).json({ message: 'User not found' })

    const user = rows[0]

    // Password change flow
    if (current_password && new_password) {
      const match = await bcrypt.compare(current_password, user.password_hash)
      if (!match)
        return res.status(400).json({ message: 'Current password is incorrect' })

      const newHash = await bcrypt.hash(new_password, 10)
      await db.query('UPDATE USER SET password_hash = ? WHERE user_id = ?', [newHash, user.user_id])
      return res.json({ message: 'Password updated successfully' })
    }

    // Profile info update
    if (username || email) {
      // Check email uniqueness if changing
      if (email && email !== user.email) {
        const [existing] = await db.query(
          'SELECT user_id FROM USER WHERE email = ? AND user_id != ?',
          [email, user.user_id]
        )
        if (existing.length > 0)
          return res.status(400).json({ message: 'Email already in use' })
      }

      await db.query(
        'UPDATE USER SET username = ?, email = ? WHERE user_id = ?',
        [username || user.username, email || user.email, user.user_id]
      )

      const [updated] = await db.query(
        'SELECT user_id, username, email, role FROM USER WHERE user_id = ?',
        [user.user_id]
      )
      return res.json({ message: 'Profile updated', user: updated[0] })
    }

    res.status(400).json({ message: 'Nothing to update' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
