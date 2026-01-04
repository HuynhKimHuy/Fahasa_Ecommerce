// helpers/cart.helper.js
import Cart from "../utils/Cart.js";
import Book from "../model/product.js";

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

// Cập nhật lại giá và thông tin sản phẩm từ DB trước khi hiển thị/tính toán
export async function refreshCartWithLatestPrices(req) {
  const cart = getCartFromSession(req);
  const ids = Object.keys(cart.items || {});
  if (!ids.length) {
    saveCartToSession(req, cart);
    return getCartViewModel(req);
  }

  const books = await Book.find({ _id: { $in: ids } }).lean();
  const map = new Map(books.map((b) => [String(b._id), b]));

  cart.totalQty = 0;
  cart.totalPrice = 0;

  ids.forEach((id) => {
    const stored = cart.items[id];
    const book = map.get(id);
    if (!stored || !book) {
      delete cart.items[id];
      return;
    }
    const latestPrice = book.newPrice ?? book.price ?? book.oldPrice ?? 0;
    stored.item = book;
    stored.price = latestPrice;
    stored.totalItemPrice = latestPrice * stored.qty;
    cart.totalQty += stored.qty;
    cart.totalPrice += stored.totalItemPrice;
  });

  saveCartToSession(req, cart);
  return getCartViewModel(req);
}
