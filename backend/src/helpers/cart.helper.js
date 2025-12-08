// helpers/cart.helper.js
import Cart from "../utils/Cart.js";

// Lấy Cart từ session (nếu chưa có thì tạo mới)
export function getCartFromSession(req) {
  const oldCart = req.session.cart || {}
  const cart = new Cart(oldCart)
  return cart
}

// Lưu Cart vào session
export function saveCartToSession(req, cart) {
  req.session.cart = cart
}

// Chuẩn hoá data để render view
export function getCartViewModel(req) {
  const cart = new Cart(req.session.cart || {})
  return {
    items: cart.generateArray(),
    totalQty: cart.totalQty,
    totalPrice: cart.totalPrice,
  }
}
