const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const auth    = require('../middleware/auth')

// POST /api/orders/checkout  — create order from cart
router.post('/checkout', auth, async (req, res) => {
  const { payment_method, address } = req.body
  if (!payment_method)
    return res.status(400).json({ message: 'Payment method is required' })

  try {
    // 1. Get cart items
    const [cartItems] = await db.query(
      `SELECT ci.cart_item_id, ci.game_id, ci.quantity, g.price, g.stock
       FROM CART_ITEM ci
       JOIN CART c ON ci.cart_id = c.cart_id
       JOIN GAME g  ON ci.game_id = g.game_id
       WHERE c.user_id = ?`,
      [req.user.user_id]
    )

    if (cartItems.length === 0)
      return res.status(400).json({ message: 'Cart is empty' })

    // 2. Calculate total
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // 3. Create order
    const [orderResult] = await db.query(
      'INSERT INTO `ORDERS` (user_id, total_amount, status, delivery_name, delivery_street, delivery_city, delivery_phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
[req.user.user_id, total, 'completed', address?.name || '', address?.street || '', address?.city || '', address?.phone || '']
    )
    const orderId = orderResult.insertId

    // 4. Insert order items
    for (const item of cartItems) {
      await db.query(
        'INSERT INTO ORDER_ITEM (order_id, game_id, price_at_purchase) VALUES (?, ?, ?)',
        [orderId, item.game_id, item.price]
      )
      // Reduce stock
      await db.query(
        'UPDATE GAME SET stock = GREATEST(stock - ?, 0) WHERE game_id = ?',
        [item.quantity, item.game_id]
      )
    }

    // 5. Create payment record
    await db.query(
      'INSERT INTO PAYMENT (order_id, method, status, amount) VALUES (?, ?, ?, ?)',
      [orderId, payment_method, 'paid', total]
    )

    // 6. Clear cart
    const [carts] = await db.query('SELECT cart_id FROM CART WHERE user_id = ?', [req.user.user_id])
    if (carts.length > 0) {
      await db.query('DELETE FROM CART_ITEM WHERE cart_id = ?', [carts[0].cart_id])
    }

    res.status(201).json({ message: 'Order placed successfully', order_id: orderId, total })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/orders  — get current user's order history
router.get('/', auth, async (req, res) => {
  try {
 const [orders] = await db.query(
  `SELECT o.order_id, o.total_amount, o.status, o.created_at,
          o.delivery_name, o.delivery_street, o.delivery_city, o.delivery_phone,
          p.method AS payment_method
   FROM ORDERS o
   LEFT JOIN PAYMENT p ON o.order_id = p.order_id
   WHERE o.user_id = ?
   ORDER BY o.created_at DESC`,
  [req.user.user_id]
)

    // Get items for each order
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.price_at_purchase, oi.game_id, g.title, g.cover_image
         FROM ORDER_ITEM oi
         JOIN GAME g ON oi.game_id = g.game_id
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

module.exports = router
