export function normalizeBookPrices(book) {
  if (!book) return book

  const basePrice = book.newPrice ?? book.price ?? book.oldPrice ?? 0
  const oldPrice = book.oldPrice ?? book.price ?? basePrice
  const newPrice = book.newPrice ?? book.price ?? basePrice
  const ratingAverage = Number(book.ratingAverage ?? 0) || 0
  const ratingCount = Number(book.ratingCount ?? 0) || 0
  const hasRating = ratingCount > 0 && ratingAverage > 0
  const ratingLabel = hasRating ? (Math.round(ratingAverage * 10) / 10).toFixed(1) : ""

  return {
    ...book,
    newPrice,
    oldPrice,
    price: basePrice,
    ratingAverage,
    ratingCount,
    ratingLabel,
    hasRating,
  }
}

export function normalizeBooksList(books = []) {
  return books.map(normalizeBookPrices)
}
