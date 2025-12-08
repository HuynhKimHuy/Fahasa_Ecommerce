import Book from "../model/product.js";
import { normalizeBooksList } from "../helpers/book.helper.js";

class HomeController{
    async index(req,res,next){
        try {
            const saleBooksRaw = await Book.find({ isFlashSale: true }).limit(10).lean();
            const saleBooks = normalizeBooksList(saleBooksRaw);
            return res.render('Home', { saleBooks });
        } catch (error) {
            console.log('không thể lấy ra các mục trong db ', error);
            return res.render('Home', { saleBooks: [] });
        }
    }
    async giftCookie(req,res,next){
        try {
            return res.render('GifCookie')
        } catch (error) {
            console.log("Cannot get GifCookie");
        }
    }
    // GET :slug
    async show(req,res,next){
        try{
            res.send('NEW DETAIL!!!')
        }
        catch(error){
            console.log('Canot get Slug',error)
        }
    }
}
export default new HomeController   
