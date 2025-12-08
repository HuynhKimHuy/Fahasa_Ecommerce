export function normalizeBookPrices(book) {
  if (!book) return book

  const basePrice = book.newPrice ?? book.price ?? book.oldPrice ?? 0
  const oldPrice = book.oldPrice ?? book.price ?? basePrice
  const newPrice = book.newPrice ?? book.price ?? basePrice

  return {
    ...book,
    newPrice,
    oldPrice,
    price: basePrice,
  }
}

export function normalizeBooksList(books = []) {
  return books.map(normalizeBookPrices)
}
