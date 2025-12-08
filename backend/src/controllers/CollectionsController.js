import Book from '../model/product.js';
import { normalizeBookPrices, normalizeBooksList } from '../helpers/book.helper.js';

class CollectionsController {
    async index(req, res, next) {
        try {
            const booksRaw = await Book.find({ isActive: true }).lean();
            const books = normalizeBooksList(booksRaw);
            await res.render('Collections', { books });
        } catch (error) {
            console.error('Unable to fetch collections', error);
            next(error);
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
