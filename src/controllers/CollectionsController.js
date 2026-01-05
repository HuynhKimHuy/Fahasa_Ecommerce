import Book from "../model/product.js";
import Review from "../model/review.js";
import mongoose from "mongoose";
import { normalizeBookPrices, normalizeBooksList } from "../helpers/book.helper.js";
import { clampRating, recomputeBookRating } from "../helpers/rating.helper.js";

class CollectionsController {
  async index(req, res, next) {
    try {
      const { category } = req.query;
      const keywordRaw = typeof req.query.q === "string" ? req.query.q : "";
      const keyword = keywordRaw.trim();

      const andFilters = [];
      if (category) {
        andFilters.push({ category });
      }
      if (keyword) {
        const regex = new RegExp(keyword, "i");
        andFilters.push({
          $or: [{ title: regex }, { author: regex }, { slug: regex }],
        });
      }

      const mongoFilter = andFilters.length ? { $and: andFilters } : {};
      const booksRaw = await Book.find(mongoFilter).lean();
      const books = normalizeBooksList(booksRaw);

      const categories = await Book.distinct("category");
      return res.render("Collections", {
        books,
        categories,
        activeCategory: category || "all",
        searchQuery: keyword,
      });
    } catch (error) {
      console.error("Unable to fetch collections", error);
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const { slug } = req.params;
      let bookRaw = null;

      // Prefer lookup by ObjectId for uniqueness; fallback to slug
      if (mongoose.Types.ObjectId.isValid(slug)) {
        bookRaw = await Book.findById(slug).lean();
      }

      if (!bookRaw) {
        bookRaw = await Book.findOne({ slug }).lean();
      }

      const categories = await Book.distinct("category");
      const book = normalizeBookPrices(bookRaw);
      if (!book) {
        return res.status(404).render("CollectionDetail", {
          book: null,
          notFound: true,
          slug,
          categories,
        });
      }

      const ratingStats = await recomputeBookRating(book._id);
      const reviews = await Review.find({ book: book._id })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      const formattedReviews = reviews.map((review) => {
        const displayName = review.name?.trim() || "Khách hàng ẩn danh";
        const initial = displayName.charAt(0).toUpperCase() || "★";
        return {
          ...review,
          createdAtLabel: review.createdAt
            ? new Date(review.createdAt).toLocaleString("vi-VN", { hour12: false, timeZone: "Asia/Ho_Chi_Minh" })
            : "",
          displayName,
          initial,
        };
      });

      const flash = {
        status: req.query.status || "",
        message: req.query.message || "",
      };

      return res.render("CollectionDetail", {
        book: {
          ...book,
          ratingAverage: ratingStats.average,
          ratingCount: ratingStats.count,
          hasRating: ratingStats.count > 0,
          ratingLabel: ratingStats.count > 0 ? ratingStats.average.toFixed(1) : "",
          ratingFill: ratingStats.count > 0 ? Math.min(100, Math.round((ratingStats.average / 5) * 100)) : 0,
        },
        reviews: formattedReviews,
        categories,
        flash,
      });
    } catch (error) {
      console.error("Unable to load book detail", error);
      next(error);
    }
  }

  async submitReview(req, res, next) {
    try {
      const { slug } = req.params;
      let book = null;
      if (mongoose.Types.ObjectId.isValid(slug)) {
        book = await Book.findById(slug);
      }
      if (!book) {
        book = await Book.findOne({ slug });
      }
      if (!book) {
        return res.redirect(`/collection/${slug}?status=error&message=${encodeURIComponent("Không tìm thấy sách")}`);
      }
      const targetSlug = book.slug || book._id;

      const name = (req.body.name ?? "").trim();
      const comment = (req.body.comment ?? "").trim();
      const rating = clampRating(req.body.rating, 1, 5);
      const errors = [];
      if (!rating || rating < 4) {
        errors.push("Vui lòng chọn số sao từ 4 đến 5.");
      }
      if (comment.length > 2000) {
        errors.push("Nội dung đánh giá quá dài.");
      }

      if (errors.length) {
        const query = `status=error&message=${encodeURIComponent(errors[0])}`;
        return res.redirect(`/collection/${targetSlug}?${query}`);
      }

      const reviewPayload = {
        book: book._id,
        name: name || req.session?.user?.fullName || "",
        comment,
        rating,
      };
      if (mongoose.Types.ObjectId.isValid(req.session?.user?.id)) {
        reviewPayload.user = req.session.user.id;
      }

      await Review.create(reviewPayload);

      await recomputeBookRating(book._id);

      return res.redirect(
        `/collection/${targetSlug}?status=success&message=${encodeURIComponent("Cảm ơn bạn đã đánh giá sách này!")}`
      );
    } catch (error) {
      console.error("Unable to submit review", error);
      return res.redirect(
        `/collection/${req.params.slug}?status=error&message=${encodeURIComponent("Không thể gửi đánh giá lúc này")}`
      );
    }
  }
}

export default new CollectionsController();
