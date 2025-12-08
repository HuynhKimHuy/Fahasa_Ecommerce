import mongoose, { Schema } from "mongoose";

const DOCUMENT_NAME = "book";
const COLLECTION_NAME = "books";

const BookSchema = new Schema(
  {
    // Tên sách
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Mô tả 
    slug:{
      type: String,
      required : true,
      trim:true,
    },

    // Tác giả
    author: {
      type: String,
      required: true,
      trim: true,
    },

    // Thể loại
    category: {
      type: String,
      trim: true,
      required:true
    },

    // Nhà xuất bản (Nxb)
    publisher: {
      type: String,
      trim: true,
    },

    // Nhà cung cấp (FAHASA, Nhã Nam, IPM...)
    supplier: {
      type: String,
      trim: true,
      default: "",
    },

    // Năm xuất bản
    publishYear: {
      type: Number,
    },

    // phàn trăm giảm giá
    discountPercent:{
      type:Number,
    },
    
    // Giá gốc
    oldPrice: {
      type: Number,
      required: true,
    },

    // Giá bán sau sale
    newPrice: {
      type: Number,
      required: true,
    },

    // giảm giá 
    discountPercent: {
      type: Number,
      default: 0,
    },

    // Đã bán 
    sold:{
      type:Number,
      default:0,
      min:0
    },
    
    // Số lượng tồn kho
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Mô tả ngắn
    description: {
      type: String,
      default: "",
    },

    // Mô tả dài
    longDescription:{
      type:String,
      default:""
    },

    // Link ảnh bìa
    coverImage: {
      type: String,
      default: "",
    },

    // Kích thước (vd: "13 x 20 cm")
    size: {
      type: String,
      trim: true,
      default: "",
    },

    // Loại bìa (VD: "Bìa cứng" hoặc "Bìa mềm")
    coverType: {
      type: String,
      enum: ["Bìa cứng", "Bìa mềm", ""],
      default: "",
    },

    // Trạng thái hiển thị
    isActive: {
      type: Boolean,
      default: true,
    },

    // Sách nổi bật
    isHighlight: {
      type: Boolean,
      default: false,
    },

    // Flash sale
    isFlashSale: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

const Book = mongoose.model(DOCUMENT_NAME, BookSchema);

export default Book;
