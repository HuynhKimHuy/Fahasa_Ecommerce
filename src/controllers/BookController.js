import Book from "../model/product.js";
import cloudinary from "../config/cloudinary.js";

const CLOUDINARY_FOLDER = "stories";

const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  if (typeof value === "string") {
    return value === "on" || value === "true";
  }
  return Boolean(value);
};

const toText = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const createSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

async function uploadCoverImage({ file }) {
  if (!file?.buffer?.length) return null;
  const dataUri = `data:${file.mimetype || "image/jpeg"};base64,${file.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: CLOUDINARY_FOLDER,
    resource_type: "image",
  });
  return result.secure_url;
}

class BookController {
  async create(req, res, next) {
    try {
      const {
        title,
        slug,
        category,
        publisher,
        supplier,
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
        size,
        coverType,
        isFlashSale,
      } = req.body;

      const titleValue = toText(title);
      const slugValue = toText(slug) || createSlug(titleValue);
      const categoryValue = toText(category);
      const publisherValue = toText(publisher);
      const supplierValue = toText(supplier);
      const authorValue = toText(author);
      const descriptionValue = toText(description);
      const longDescriptionValue = toText(longDescription);
      const sizeValue = toText(size);
      const coverTypeValue = toText(coverType);

      const salePrice = toNumber(newPrice, toNumber(price, 0));
      const priceValue = toNumber(price, salePrice);
      const oldPriceValue = toNumber(oldPrice, 0);
      const publishYearValue = toNumber(publishYear, null);
      const discountValue = toNumber(discountPercent, 0);
      const stockValue = toNumber(stock, 0);
      const soldValue = toNumber(sold, 0);

      if (
        !titleValue ||
        !slugValue ||
        !categoryValue ||
        !publisherValue ||
        !supplierValue ||
        publishYearValue == null ||
        !authorValue ||
        stockValue == null ||
        !descriptionValue ||
        !longDescriptionValue ||
        !sizeValue ||
        oldPriceValue == null ||
        !coverTypeValue
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Thiếu dữ liệu bắt buộc (tiêu đề, tác giả, giá bán, tồn kho, mô tả và ảnh bìa).",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng gửi file ảnh bìa (field coverImage) dạng multipart/form-data.",
        });
      }

      const uploadedCoverImage = await uploadCoverImage({
        file: req.file,
      });

      if (!uploadedCoverImage) {
        return res.status(400).json({
          success: false,
          message: "Ảnh bìa không hợp lệ hoặc không thể tải lên Cloudinary.",
        });
      }

      const bookPayload = {
        title: titleValue,
        slug: slugValue,
        author: authorValue,
        category: categoryValue,
        publisher: publisherValue,
        supplier: supplierValue,
        publishYear: publishYearValue,
        oldPrice: oldPriceValue,
        newPrice: salePrice,
        price: priceValue,
        sold: soldValue,
        discountPercent: discountValue,
        stock: stockValue,
        description: descriptionValue,
        longDescription: longDescriptionValue,
        coverImage: uploadedCoverImage,
        size: sizeValue,
        coverType: coverTypeValue,
        isFlashSale: toBoolean(isFlashSale, false),
        isActive: toBoolean(req.body.isActive, true),
        isHighlight: toBoolean(req.body.isHighlight, false),
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
