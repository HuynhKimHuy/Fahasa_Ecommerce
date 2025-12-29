import Book from '../model/product.js';
import mongoose from 'mongoose';
import { normalizeBookPrices, normalizeBooksList } from '../helpers/book.helper.js';

class CollectionsController {
    async index(req, res, next) {
    try {
      const { category } = req.query
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
      const booksRaw = await Book.find(mongoFilter).lean()
      const books = normalizeBooksList(booksRaw)

      const categories = await Book.distinct('category')
      return res.render('Collections', {
        books,
        categories,
        activeCategory: category || 'all',
        searchQuery: keyword,
      })
    } catch (error) {
      console.error('Unable to fetch collections', error)
      next(error)
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
            const book = normalizeBookPrices(bookRaw);
            if (!book) {
                return res.status(404).render('CollectionDetail', {
                    book: null,
                    notFound: true,
                    slug,
                });
            }
            return res.render('CollectionDetail', { book });
        } catch (error) {
            console.error('Unable to load book detail', error);
            next(error);
        }
    }
}

export default new CollectionsController();
