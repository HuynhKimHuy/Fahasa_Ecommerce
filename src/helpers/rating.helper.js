import mongoose from "mongoose";
import Review from "../model/review.js";
import Book from "../model/product.js";

export const clampRating = (value, min = 1, max = 5) => {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (num < min) return min;
  if (num > max) return max;
  return num;
};

export async function recomputeBookRating(bookId) {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return { average: 0, count: 0 };
  }
  const [stats] = await Review.aggregate([
    { $match: { book: new mongoose.Types.ObjectId(bookId) } },
    {
      $group: {
        _id: "$book",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const average = stats?.average ? Math.round(stats.average * 10) / 10 : 0;
  const count = stats?.count ?? 0;

  await Book.updateOne({ _id: bookId }, { ratingAverage: average, ratingCount: count }).catch(() => {});

  return { average, count };
}
