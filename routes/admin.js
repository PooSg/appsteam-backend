const express = require('express')
const router = express.Router()
const db = require('../config/db')
const auth = require('../middleware/auth')
const isAdmin = require('../middleware/admin')

// GET all orders (admin only)
router.get('/orders', auth, isAdmin, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.order_id, o.total_amount, o.status, o.created_at,
              u.username, u.email,
              p.method AS payment_method
       FROM \`order\` o
       JOIN user u ON o.user_id = u.user_id
       LEFT JOIN payment p ON o.order_id = p.order_id
       ORDER BY o.created_at DESC`
    )

    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.price_at_purchase, g.title, g.cover_image
         FROM order_item oi
         JOIN game g ON oi.game_id = g.game_id
         WHERE oi.order_id = ?`,
        [order.order_id]
      )
      order.items = items
    }

    res.json(orders)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH update order status (admin only)
router.patch('/orders/:id/status', auth, isAdmin, async (req, res) => {
  const { status } = req.body
  try {
    await db.query(
      'UPDATE `order` SET status = ? WHERE order_id = ?',
      [status, req.params.id]
    )
    res.json({ message: 'Order status updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router