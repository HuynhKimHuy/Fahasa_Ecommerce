import Book from "../model/product.js";
import { normalizeBookPrices, normalizeBooksList } from "../helpers/book.helper.js";

class HomeController{
    async index(req,res,next){
        try {
            const flashSaleEnd = new Date();
            flashSaleEnd.setHours(23, 59, 59, 999);

            const saleBooksRaw = await Book.find({ isFlashSale: true }).limit(10).lean();
            const featuredBooksRaw = await Book.find({ isActive: true })
                .sort({ createdAt: -1 })
                .limit(12)
                .lean();

            const categoryConfigs = [
                {
                    key: "new",
                    title: "Sách mới ra mắt",
                    subtitle: "Những đầu sách vừa cập bến cửa hàng.",
                    filter: { isActive: true },
                    sort: { createdAt: -1 },
                    limit: 12,
                    viewAllUrl: "/collection",
                },
                {
                    key: "best",
                    title: "Bán chạy",
                    subtitle: "Được yêu thích và mua nhiều nhất.",
                    filter: { isActive: true },
                    sort: { sold: -1 },
                    limit: 12,
                    viewAllUrl: "/collection",
                },
                {
                    key: "manga",
                    title: "Manga / Comics",
                    subtitle: "Thế giới truyện tranh hấp dẫn.",
                    filter: { category: { $regex: /(manga|mangan|comic)/i } },
                    sort: { createdAt: -1 },
                    limit: 12,
                    viewAllUrl: `/collection?category=${encodeURIComponent("Mangan")}`,
                },
                {
                    key: "children",
                    title: "Thiếu nhi",
                    subtitle: "Sách cho bé và gia đình.",
                    filter: { category: { $regex: /(thiếu nhi|children|kid)/i } },
                    sort: { createdAt: -1 },
                    limit: 12,
                    viewAllUrl: `/collection?category=${encodeURIComponent("Thiếu nhi")}`,
                },
                {
                    key: "selfhelp",
                    title: "Tâm lý / Kỹ năng sống",
                    subtitle: "Nuôi dưỡng cảm xúc, phát triển bản thân.",
                    filter: { category: { $regex: /(self|kỹ năng|ky nang|tâm lý|tam ly)/i } },
                    sort: { createdAt: -1 },
                    limit: 12,
                    viewAllUrl: `/collection?category=${encodeURIComponent("Kỹ năng sống")}`,
                },
                {
                    key: "it",
                    title: "CNTT / Lập trình",
                    subtitle: "Công nghệ, lập trình và khoa học máy tính.",
                    filter: { category: { $regex: /(IT|lập trình|lap trinh|program|công nghệ|cong nghe)/i } },
                    sort: { createdAt: -1 },
                    limit: 12,
                    viewAllUrl: `/collection?category=${encodeURIComponent("Công nghệ thông tin")}`,
                },
                {
                    key: "literature",
                    title: "Văn học",
                    subtitle: "Tiểu thuyết, truyện ngắn và văn học kinh điển.",
                    filter: { category: { $regex: /(văn học|van hoc|literature|tiểu thuyết|tieu thuyet)/i } },
                    sort: { createdAt: -1 },
                    limit: 12,
                    viewAllUrl: `/collection?category=${encodeURIComponent("Văn học")}`,
                },
            ];

            const categorySectionsRaw = await Promise.all(
                categoryConfigs.map(async (config) => {
                    const query = Book.find(config.filter || {});
                    if (config.sort) {
                        query.sort(config.sort);
                    }
                    if (config.limit) {
                        query.limit(config.limit);
                    }
                    const books = await query.lean();
                    return {
                        key: config.key,
                        title: config.title,
                        subtitle: config.subtitle,
                        viewAllUrl: config.viewAllUrl || "/collection",
                        books: normalizeBooksList(books),
                    };
                })
            );

            const categorySections = categorySectionsRaw.filter(
                (section) => Array.isArray(section.books) && section.books.length
            );

            const saleBooks = normalizeBooksList(saleBooksRaw);
            const featuredBooks = normalizeBooksList(featuredBooksRaw);

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

            return res.render('Home', {
                saleBooks,
                featuredBooks,
                categories,
                categorySections,
                flashSaleEndTime: flashSaleEnd.toISOString(),
            });
        } catch (error) {
            console.log('không thể lấy ra các mục trong db ', error);
            return res.render('Home', {
                saleBooks: [],
                featuredBooks: [],
                categories: [],
                categorySections: [],
                flashSaleEndTime: null,
            });
        }
    }
    async flashSale(req,res,next){
        try {
            const flashSaleEnd = new Date();
            flashSaleEnd.setHours(23, 59, 59, 999);

            const saleBooksRaw = await Book.find({ isFlashSale: true }).lean();
            const saleBooks = normalizeBooksList(saleBooksRaw);
            return res.render('FlashSale',{ saleBooks, flashSaleEndTime: flashSaleEnd.toISOString() });
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
            const categories = await Book.distinct("category");
            const book = normalizeBookPrices(bookRaw);
            if(!book){
                return res.status(404).render('CollectionDetail', {
                    book:null,
                    notFound:true,
                    slug,
                    categories,
                });
            }
            return res.render('CollectionDetail',{ book, categories });
        } catch (error) {
            console.log("Cannot load book detail", error);
            next(error);
        }
    }
}
export default new HomeController   
