import Book from "../model/product.js";

class BookController {
  async create(req, res, next) {
    try {
      const {
        title,
        slug,
        category,
        publisher,
        suppelier,
        publishYear,
        author,
        oldPrice,
        newPrice,
        price,
        sold,
        discountPercent,
        stock,
        description,
        longDescription,
        coverImage,
        size,
        coverType,
        isFlashSale,
      } = req.body;

      const salePrice = newPrice ?? price;

      if (
        !title ||
        !slug ||
        !category ||
        !publisher ||
        !suppelier ||
        !publishYear ||
        !author ||
        sold == null ||
        stock == null ||
        !description ||
        !longDescription ||
        !coverImage ||
        !size ||
        oldPrice == null ||
        !coverType ||
        isFlashSale == null ||
        salePrice == null ||
        discountPercent == null
      ) {
        return res.status(400).json({
          success: false,
          message: "title, author, oldPrice and newPrice are required fields",
        });
      }

      const bookPayload = {
        ...req.body,
        newPrice: salePrice,
      };

      const book = await Book.create(bookPayload);
      return res.status(201).json({
        success: true,
        book,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BookController();
