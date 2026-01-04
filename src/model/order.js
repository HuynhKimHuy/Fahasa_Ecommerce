import mongoose, { Schema } from "mongoose";

const DOCUMENT_NAME = "order";
const COLLECTION_NAME = "orders";

const OrderItemSchema = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: "book", required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    coverImage: { type: String, default: "" },
  },
  { _id: false }
);

const ShippingSchema = new Schema(
  {
    detailAddress: { type: String, required: true, trim: true },
    ward: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    province: { type: String, trim: true, default: "" },
    fullAddress: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "user", index: true },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    shipping: { type: ShippingSchema, required: true },
    note: { type: String, trim: true, default: "" },
    totalQty: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    items: { type: [OrderItemSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "completed", "canceled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "card"],
      default: "cod",
    },
  },
  { collection: COLLECTION_NAME, timestamps: true }
);

OrderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model(DOCUMENT_NAME, OrderSchema);

export default Order;
