import mongoose, { Schema } from "mongoose";

const DOCUMENT_NAME = "user";
const COLLECTION_NAME = "users";

const AddressSchema = new Schema(
  {
    label: { type: String, trim: true, default: "" }, // nhà riêng / cơ quan...
    recipientName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    detailAddress: { type: String, trim: true, default: "" }, // số nhà, đường
    ward: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    province: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      match: /^(0|\+84)[0-9]{8,10}$/,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    addresses: {
      type: [AddressSchema],
      default: [],
    },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

const User = mongoose.model(DOCUMENT_NAME, UserSchema);
export default User;
