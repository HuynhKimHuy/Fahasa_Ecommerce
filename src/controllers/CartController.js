// controllers/cart.controller.js
import Book from "../model/product.js"
import {
  getCartFromSession,
  saveCartToSession,
  getCartViewModel,
} from "../helpers/cart.helper.js"

export const addToCart = async (req, res) => {
  try {
    const bookId = req.params.bookId

    const book = await Book.findById(bookId).lean()
    if (!book) {
      return res.redirect("back")
    }

    const { qty, quantity: quantityField } = req.body
    const rawQty = qty ?? quantityField
    const quantity = Number(rawQty) > 0 ? Number(rawQty) : 1
    const cart = getCartFromSession(req)

    cart.add(book, bookId, quantity)

    saveCartToSession(req, cart)

    console.log("Cart sau khi add:", req.session.cart)

    return res.redirect("/cart")
  } catch (error) {
    console.log("Lỗi addToCart:", error)
    return res.redirect("back")
  }
}

export const showCart = (req, res) => {
  const cartVM = getCartViewModel(req)

  res.render("cart/Cart", {
    cart: cartVM,
  })
}

// Update số lượng 1 item
export const updateCartItem = (req, res) => {
  const { bookId } = req.params
  const { qty } = req.body // nhớ name="qty" trong form

  const cart = getCartFromSession(req)
  cart.update(bookId, Number(qty))
  saveCartToSession(req, cart)

  return res.redirect("/cart")
}

// Xoá 1 item
export const removeCartItem = (req, res) => {
  const { bookId } = req.params

  const cart = getCartFromSession(req)
  cart.remove(bookId)
  saveCartToSession(req, cart)

  return res.redirect("/cart")
}
