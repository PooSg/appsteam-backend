const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const auth    = require('../middleware/auth')

// GET /api/cart  — get current user's cart items
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ci.cart_item_id, ci.quantity, ci.game_id,
              g.title, g.price, g.genre, g.cover_image
       FROM CART_ITEM ci
       JOIN CART c ON ci.cart_id = c.cart_id
       JOIN GAME  g ON ci.game_id = g.game_id
       WHERE c.user_id = ?`,
      [req.user.user_id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/cart  — add a game to cart
router.post('/', auth, async (req, res) => {
  const { game_id, quantity = 1 } = req.body
  if (!game_id)
    return res.status(400).json({ message: 'game_id is required' })

  try {
    // Get user's cart
    const [carts] = await db.query('SELECT cart_id FROM CART WHERE user_id = ?', [req.user.user_id])

    let cartId
    if (carts.length === 0) {
      // Create cart if it doesn't exist
      const [result] = await db.query('INSERT INTO CART (user_id) VALUES (?)', [req.user.user_id])
      cartId = result.insertId
    } else {
      cartId = carts[0].cart_id
    }

    // Check if game already in cart
    const [existing] = await db.query(
      'SELECT cart_item_id, quantity FROM CART_ITEM WHERE cart_id = ? AND game_id = ?',
      [cartId, game_id]
    )

    if (existing.length > 0) {
      // Update quantity
      await db.query(
        'UPDATE CART_ITEM SET quantity = quantity + ? WHERE cart_item_id = ?',
        [quantity, existing[0].cart_item_id]
      )
    } else {
      // Insert new item
      await db.query(
        'INSERT INTO CART_ITEM (cart_id, game_id, quantity) VALUES (?, ?, ?)',
        [cartId, game_id, quantity]
      )
    }

    res.status(201).json({ message: 'Added to cart' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/cart/:itemId  — remove item from cart
router.delete('/:itemId', auth, async (req, res) => {
  try {
    // Make sure the item belongs to the current user
    const [rows] = await db.query(
      `SELECT ci.cart_item_id FROM CART_ITEM ci
       JOIN CART c ON ci.cart_id = c.cart_id
       WHERE ci.cart_item_id = ? AND c.user_id = ?`,
      [req.params.itemId, req.user.user_id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'Item not found' })

    await db.query('DELETE FROM CART_ITEM WHERE cart_item_id = ?', [req.params.itemId])
    res.json({ message: 'Item removed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
