import Book from "../model/product.js";
import { normalizeBookPrices, normalizeBooksList } from "../helpers/book.helper.js";

class HomeController{
    async index(req,res,next){
        try {
            const saleBooksRaw = await Book.find({ isFlashSale: true }).limit(10).lean();
            const manganBook = await Book.find({category:"Mangan"}).lean()

            const saleBooks = normalizeBooksList(saleBooksRaw);

            const categoriesRaw = await Book.aggregate([
                { $match: { isActive: true } },
                {
                  $group: {
                    _id: "$category",
                    coverImage: { $first: "$coverImage" },
                  },
                },
                { $sort: { _id: 1 } },
                {
                  $project: {
                    _id: 0,
                    name: "$_id",
                    coverImage: 1,
                  },
                },
                { $limit: 6 },
            ]);

            const categories = categoriesRaw.map(category => ({
                ...category,
                coverImage: category.coverImage || '/img/image.png',
            }));

            return res.render('Home', { saleBooks, manganBook, categories });
        } catch (error) {
            console.log('không thể lấy ra các mục trong db ', error);
            return res.render('Home', { saleBooks: [], categories: [] });
        }
    }
    async flashSale(req,res,next){
        try {
            const saleBooksRaw = await Book.find({ isFlashSale: true }).lean();
            const saleBooks = normalizeBooksList(saleBooksRaw);
            return res.render('FlashSale',{ saleBooks });
        } catch (error) {
            console.log('Cannot load flash sale page', error);
            next(error);
        }
    }
    async giftPage(req,res,next){
        try {
            return res.render('GiftPage')
        } catch (error) {
            console.log("Cannot get GifCookie");
        }
    }
    async show(req,res,next){
        try {
            const { slug } = req.params;
            const bookRaw = await Book.findOne({ slug }).lean();
            const book = normalizeBookPrices(bookRaw);
            if(!book){
                return res.status(404).render('CollectionDetail', {
                    book:null,
                    notFound:true,
                    slug,
                });
            }
            return res.render('CollectionDetail',{ book });
        } catch (error) {
            console.log("Cannot load book detail", error);
            next(error);
        }
    }
}
export default new HomeController   
