export default class Cart {
  constructor(oldCart) {
    this.items = oldCart?.items || {}
    this.totalQty = oldCart?.totalQty || 0
    this.totalPrice = oldCart?.totalPrice || 0
  }

  // Thêm sách vào giỏ
  add(book, bookId, qty = 1) {
    let storedItem = this.items[bookId]

    if (!storedItem) {
      storedItem = this.items[bookId] = {
        item: book,
        qty: 0,
        price: book.newPrice ?? book.price ?? book.oldPrice ?? 0, // chỉnh field tuỳ model
        totalItemPrice: 0,
      }
    }

    storedItem.qty += qty
    storedItem.totalItemPrice = storedItem.price * storedItem.qty

    this.totalQty += qty
    this.totalPrice += storedItem.price * qty
  }

  // Cập nhật số lượng 1 item
  update(bookId, newQty) {
    const item = this.items[bookId]
    if (!item) return

    // Trừ số cũ khỏi tổng
    this.totalQty -= item.qty
    this.totalPrice -= item.totalItemPrice

    // Cập nhật số mới
    item.qty = newQty
    item.totalItemPrice = item.price * item.qty

    // Cộng lại
    this.totalQty += item.qty
    this.totalPrice += item.totalItemPrice

    // Nếu số lượng <= 0 thì xoá luôn khỏi giỏ
    if (item.qty <= 0) {
      delete this.items[bookId]
    }
  }

  // Xoá hẳn 1 item khỏi giỏ
  remove(bookId) {
    const item = this.items[bookId]
    if (!item) return

    this.totalQty -= item.qty
    this.totalPrice -= item.totalItemPrice

    delete this.items[bookId]
  }

  // Trả về mảng để render trên view
  generateArray() {
    return Object.entries(this.items).map(([bookId, storedItem]) => ({
      bookId,
      product: storedItem.item,
      qty: storedItem.qty,
      price: storedItem.price,
      totalItemPrice: storedItem.totalItemPrice,
    }))
  }
}
