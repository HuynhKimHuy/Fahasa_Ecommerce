// controllers/cart.controller.js
import Book from "../model/product.js"
import {
  getCartFromSession,
  saveCartToSession,
  refreshCartWithLatestPrices,
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

export const showCart = async (req, res, next) => {
  try {
    const cartVM = await refreshCartWithLatestPrices(req)
    res.render("cart/Cart", {
      cart: cartVM,
    })
  } catch (error) {
    next(error)
  }
}

// Update số lượng 1 item
export const updateCartItem = (req, res) => {
  const { bookId } = req.params
  const { qty } = req.body // nhớ name="qty" trong form

  return Book.findById(bookId)
    .lean()
    .then((book) => {
      const cart = getCartFromSession(req)
      cart.update(bookId, Number(qty), book)
      saveCartToSession(req, cart)
      return res.redirect("/cart")
    })
    .catch(() => res.redirect("/cart"))
}

// Xoá 1 item
export const removeCartItem = (req, res) => {
  const { bookId } = req.params

  const cart = getCartFromSession(req)
  cart.remove(bookId)
  saveCartToSession(req, cart)

  return res.redirect("/cart")
}
