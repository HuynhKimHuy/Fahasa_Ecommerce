import Book from '../model/product.js';
import { normalizeBookPrices, normalizeBooksList } from '../helpers/book.helper.js';

class CollectionsController {
    async index(req, res, next) {
    try {
      const { category } = req.query

      const filter = {}
      if (category) filter.category = category
        console.log(filter)
      const booksRaw = await Book.find(filter).lean()
      const books = normalizeBooksList(booksRaw)

      const categories = await Book.distinct('category')
      return res.render('Collections', {
        books,
        categories,
        activeCategory: category || 'all',
      })
    } catch (error) {
      console.error('Unable to fetch collections', error)
      next(error)
    }
  }
    async show(req, res, next) {
        try {
            const { slug } = req.params;
            const bookRaw = await Book.findOne({ slug }).lean();
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
