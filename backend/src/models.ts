import mongoose, { Schema, type InferSchemaType } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    category: { type: String, required: true, trim: true },
    price: { type: Number, min: 0, default: null },
    compareAtPrice: { type: Number, min: 0, default: null },
    weight: { type: String, default: "100g" },
    stock: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    passwordResetTokenHash: { type: String, default: undefined, select: false },
    passwordResetExpiresAt: { type: Date, default: undefined, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    tokenVersion: { type: Number, default: 0 },
    phone: { type: String, default: "" },
    addresses: [{
      label: { type: String, default: "" },
      recipient: { type: String, default: "" },
      phone: { type: String, default: "" },
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      postalCode: { type: String, default: "" }
    }],
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    recipeWishlist: [{ type: Schema.Types.ObjectId, ref: "Recipe" }]
  },
  { timestamps: true }
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [{
      product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true, min: 1 }
    }]
  },
  { timestamps: true }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true }
    },
    items: [{
      product: { type: Schema.Types.ObjectId, ref: "Product", default: null },
      name: { type: String, required: true },
      image: { type: String, default: "" },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      weight: { type: String, default: "" }
    }],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true, default: 0 },
    tax: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod"], required: true, default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

const categorySchema = new Schema(
  { name: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true } },
  { timestamps: true }
);

const settingsSchema = new Schema(
  { key: { type: String, required: true, unique: true }, value: { type: Schema.Types.Mixed, default: {} } },
  { timestamps: true }
);

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "read", "resolved"], default: "new" }
  },
  { timestamps: true }
);

const recipeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    imageAlt: { type: String, required: true },
    prepMinutes: { type: Number, required: true, min: 1 },
    ingredients: [{ name: { type: String, required: true }, quantity: { type: String, required: true } }],
    instructions: [{ type: String, required: true }],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    productName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 1200 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
  },
  { timestamps: true }
);
reviewSchema.index({ user: 1, order: 1, product: 1 }, { unique: true });

export type Product = InferSchemaType<typeof productSchema>;
export const ProductModel = mongoose.models.Product ?? mongoose.model("Product", productSchema);
export const UserModel = mongoose.models.User ?? mongoose.model("User", userSchema);
export const CartModel = mongoose.models.Cart ?? mongoose.model("Cart", cartSchema);
export const OrderModel = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
export const CategoryModel = mongoose.models.Category ?? mongoose.model("Category", categorySchema);
export const SettingsModel = mongoose.models.StoreSetting ?? mongoose.model("StoreSetting", settingsSchema);
export const ContactMessageModel = mongoose.models.ContactMessage ?? mongoose.model("ContactMessage", contactMessageSchema);
export const RecipeModel = mongoose.models.Recipe ?? mongoose.model("Recipe", recipeSchema);
export const ReviewModel = mongoose.models.Review ?? mongoose.model("Review", reviewSchema);
