import mongoose, { Schema } from "mongoose";

const DOCUMENT_NAME = "review";
const COLLECTION_NAME = "reviews";

const ReviewSchema = new Schema(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: "book",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

ReviewSchema.index({ book: 1, createdAt: -1 });

const Review = mongoose.model(DOCUMENT_NAME, ReviewSchema);
export default Review;
