import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createHash, randomBytes } from "node:crypto";
import express, { type ErrorRequestHandler, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "express-async-errors";
import { z } from "zod";
import { connectDatabase } from "./db.js";
import { authenticate, requireAdmin, type AuthRequest, validate } from "./middleware.js";
import { CartModel, CategoryModel, ContactMessageModel, OrderModel, ProductModel, RecipeModel, ReviewModel, SettingsModel, UserModel } from "./models.js";
import { seedStore } from "./seed.js";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const app = express();
const port = Number(process.env.PORT ?? 4000);
const isProduction = process.env.NODE_ENV === "production";
const frontendOrigins = (process.env.FRONTEND_ORIGIN ?? (isProduction ? "" : "http://localhost:5173"))
  .split(",")
  .map((value) => value.trim().replace(/\/$/, ""))
  .filter(Boolean);
if (frontendOrigins.length === 0) {
  throw new Error("Set FRONTEND_ORIGIN to the deployed frontend origin before starting the API.");
}
for (const frontendOrigin of frontendOrigins) {
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(frontendOrigin);
  } catch {
    throw new Error("FRONTEND_ORIGIN must contain valid frontend origins, separated by commas.");
  }
  if (parsedOrigin.origin !== frontendOrigin || (isProduction && parsedOrigin.protocol !== "https:")) {
    throw new Error("FRONTEND_ORIGIN must contain exact origins only; production origins must use HTTPS.");
  }
}
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: "/"
};

app.disable("x-powered-by");
if (isProduction) app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: frontendOrigins, credentials: true }));
app.use((req, res, next) => {
  if (isProduction && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const requestOrigin = req.get("origin");
    if (requestOrigin && !frontendOrigins.includes(requestOrigin)) {
      res.status(403).json({ error: "This request origin is not allowed." });
      return;
    }
  }
  next();
});
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false }));

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128)
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });
const checkoutSettingsSchema = z.object({
  delivery: z.object({
    baseFee: z.number().min(0).max(100000),
    freeDeliveryMinimumSubtotal: z.number().min(0).max(10000000).nullable()
  }),
  vat: z.object({
    enabled: z.boolean(),
    ratePercent: z.number().min(0).max(100)
  }).refine((vat) => !vat.enabled || vat.ratePercent > 0, "Enter a VAT rate greater than 0 before enabling VAT.")
});
type CheckoutSettings = z.infer<typeof checkoutSettingsSchema>;
const productImageSchema = z.string().max(1000).optional().default("").refine((image) => {
  if (!image || image.startsWith("/")) return true;
  try {
    const url = new URL(image);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "Use an http(s) image URL or a site path beginning with /.");
const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(3000).optional().default(""),
  image: productImageSchema,
  category: z.string().trim().min(2).max(100),
  price: z.number().min(0).nullable().optional().default(null),
  compareAtPrice: z.number().min(0).nullable().optional().default(null),
  weight: z.string().max(40).optional().default("100g"),
  stock: z.number().int().min(0).max(100000).optional().default(0),
  active: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false)
});
const recipeSchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(1200),
  image: z.string().trim().min(1).max(1000),
  imageAlt: z.string().trim().min(5).max(250),
  prepMinutes: z.number().int().min(1).max(1440),
  ingredients: z.array(z.object({ name: z.string().trim().min(1).max(160), quantity: z.string().trim().min(1).max(60) })).min(1).max(60),
  instructions: z.array(z.string().trim().min(10).max(1200)).min(1).max(40),
  active: z.boolean().optional().default(true)
});

function setSession(res: express.Response, user: { id: string; role: "customer" | "admin"; tokenVersion: number }): void {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters.");
  const token = jwt.sign({ sub: user.id, role: user.role, version: user.tokenVersion }, secret, { expiresIn: "7d" });
  res.cookie("roshona_session", token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected"
  });
});
app.get("/api/storefront/settings", async (_req, res) => {
  const setting = await SettingsModel.findOne({ key: "checkout" }).select("value");
  const parsed = checkoutSettingsSchema.safeParse(setting?.value);
  res.json({ checkout: parsed.success ? parsed.data : null });
});

app.get("/api/recipes", async (_req, res) => {
  const recipes = await RecipeModel.find({ active: true }).sort({ title: 1 }).limit(100);
  res.json({ recipes });
});

app.get("/api/recipes/:slug", async (req, res) => {
  const recipe = await RecipeModel.findOne({ slug: req.params.slug, active: true });
  if (!recipe) { res.status(404).json({ error: "Recipe not found." }); return; }
  res.json({ recipe });
});

app.get("/api/reviews", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 24);
  const reviews = await ReviewModel.find({ status: "approved" })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ reviews });
});

app.get("/api/products/:slug/reviews", async (req, res) => {
  const product = await ProductModel.findOne({ slug: req.params.slug, active: true }).select("_id");
  if (!product) { res.status(404).json({ error: "Product not found." }); return; }
  const reviews = await ReviewModel.find({ product: product._id, status: "approved" })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ reviews });
});

app.get("/api/products", async (req, res) => {
  const filter: Record<string, unknown> = { active: true };
  if (typeof req.query.category === "string") filter.category = req.query.category;
  if (req.query.featured === "true") filter.featured = true;
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    const term = req.query.q.trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ name: { $regex: term, $options: "i" } }, { description: { $regex: term, $options: "i" } }];
  }
  const products = await ProductModel.find(filter).sort({ featured: -1, name: 1 }).limit(100);
  res.json({ products });
});

app.get("/api/products/:slug", async (req, res) => {
  const product = await ProductModel.findOne({ slug: req.params.slug, active: true });
  if (!product) { res.status(404).json({ error: "Product not found." }); return; }
  res.json({ product });
});

async function findReviewableDeliveredOrder(userId: string, productId: string) {
  const deliveredOrders = await OrderModel.find({
    user: userId, status: "delivered", "items.product": productId
  }).select("_id").sort({ createdAt: -1 });
  if (!deliveredOrders.length) return { order: null, hasDeliveredPurchase: false };
  const orderIds = deliveredOrders.map((order) => order._id);
  const existingReviews = await ReviewModel.find({
    user: userId, product: productId, order: { $in: orderIds }
  }).select("order");
  const reviewedOrderIds = new Set(existingReviews.map((review) => review.order.toString()));
  const order = deliveredOrders.find((candidate) => !reviewedOrderIds.has(candidate._id.toString()));
  return { order: order ?? null, hasDeliveredPurchase: true };
}

app.get("/api/reviews/eligibility/:productId", authenticate, async (req: AuthRequest, res) => {
  const productId = req.params.productId;
  if (typeof productId !== "string" || !mongoose.isValidObjectId(productId)) { res.status(400).json({ error: "Invalid product identifier." }); return; }
  const { order, hasDeliveredPurchase } = await findReviewableDeliveredOrder(req.user!.id, productId);
  res.json({
    eligible: order !== null,
    reason: order ? null : hasDeliveredPurchase
      ? "You have already reviewed this product for every delivered order."
      : "Reviews are available after a verified order has been delivered."
  });
});

app.post("/api/reviews", authenticate, validate(z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1200)
})), async (req: AuthRequest, res) => {
  const { productId, rating, comment } = req.body as { productId: string; rating: number; comment: string };
  const product = await ProductModel.findOne({ _id: productId, active: true }).select("name");
  if (!product) { res.status(404).json({ error: "Product not found." }); return; }
  const { order, hasDeliveredPurchase } = await findReviewableDeliveredOrder(req.user!.id, productId);
  if (!hasDeliveredPurchase) { res.status(403).json({ error: "Only customers with a delivered order can review this product." }); return; }
  if (!order) {
    res.status(409).json({ error: "You have already reviewed this product for every delivered order." });
    return;
  }
  let review;
  try {
    review = await ReviewModel.create({
      user: req.user!.id, product: product._id, order: order._id,
      productName: product.name, rating, comment, status: "pending"
    });
  } catch (error) {
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      res.status(409).json({ error: "You have already reviewed this product from this order." });
      return;
    }
    throw error;
  }
  res.status(201).json({ review: { id: review.id, status: review.status }, message: "Thanks for sharing your experience. Your verified review is awaiting moderation." });
});

app.get("/api/account/recipe-wishlist", authenticate, async (req: AuthRequest, res) => {
  const user = await UserModel.findById(req.user!.id).populate("recipeWishlist");
  res.json({ recipes: user?.recipeWishlist ?? [] });
});

app.put("/api/account/recipe-wishlist", authenticate, validate(z.object({
  recipeId: z.string().regex(/^[a-f\d]{24}$/i)
})), async (req: AuthRequest, res) => {
  const recipeId = req.body.recipeId as string;
  if (!(await RecipeModel.exists({ _id: recipeId, active: true }))) { res.status(404).json({ error: "Recipe not found." }); return; }
  const user = await UserModel.findById(req.user!.id);
  if (!user) { res.status(404).json({ error: "Account not found." }); return; }
  const exists = user.recipeWishlist.some((id: mongoose.Types.ObjectId) => id.toString() === recipeId);
  user.recipeWishlist = exists
    ? user.recipeWishlist.filter((id: mongoose.Types.ObjectId) => id.toString() !== recipeId)
    : [...user.recipeWishlist, new mongoose.Types.ObjectId(recipeId)];
  await user.save();
  res.json({ recipeWishlist: user.recipeWishlist });
});

app.get("/api/categories", async (_req, res) => {
  const categories = await CategoryModel.find().sort({ name: 1 });
  res.json({ categories });
});

app.post("/api/contact", rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-7", legacyHeaders: false }), validate(z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(4000)
})), async (req, res) => {
  const message = await ContactMessageModel.create(req.body);
  res.status(201).json({ message: { id: message.id, status: message.status }, confirmation: "Your message has been received." });
});

app.post("/api/auth/register", validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body as z.infer<typeof registerSchema>;
  const normalizedEmail = email.toLowerCase();
  if (await UserModel.exists({ email: normalizedEmail })) { res.status(409).json({ error: "An account with this email already exists." }); return; }
  const user = await UserModel.create({ name, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
  setSession(res, { id: user.id, role: user.role, tokenVersion: user.tokenVersion });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post("/api/auth/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) { res.status(401).json({ error: "Email or password is incorrect." }); return; }
  setSession(res, { id: user.id, role: user.role, tokenVersion: user.tokenVersion });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post("/api/auth/logout", (_req, res) => { res.clearCookie("roshona_session", cookieOptions); res.status(204).end(); });

app.post("/api/auth/forgot-password", validate(z.object({ email: z.string().trim().email().max(254) })), async (req, res) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !EMAIL_FROM) {
    res.status(503).json({ error: "Password recovery is unavailable until the store configures its email service." });
    return;
  }
  const user = await UserModel.findOne({ email: (req.body.email as string).toLowerCase() });
  if (user) {
    const token = randomBytes(32).toString("hex");
    user.passwordResetTokenHash = createHash("sha256").update(token).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const resetUrl = new URL("/reset-password", origin);
    resetUrl.searchParams.set("token", token);
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      ...(SMTP_USER && SMTP_PASSWORD ? { auth: { user: SMTP_USER, pass: SMTP_PASSWORD } } : {})
    });
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: user.email,
      subject: "Reset your Roshona password",
      text: `Use this link to reset your password within one hour: ${resetUrl.toString()}`
    });
  }
  res.json({ message: "If an account exists for that email, password-reset instructions have been sent." });
});

app.post("/api/auth/reset-password", validate(z.object({
  token: z.string().regex(/^[a-f\d]{64}$/i),
  password: z.string().min(12).max(128)
})), async (req, res) => {
  const { token, password } = req.body as { token: string; password: string };
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const user = await UserModel.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } })
    .select("+passwordResetTokenHash +passwordResetExpiresAt +passwordHash");
  if (!user) { res.status(400).json({ error: "This password-reset link is invalid or has expired." }); return; }
  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.tokenVersion += 1;
  await user.save();
  res.json({ message: "Your password has been reset. Please sign in again." });
});

app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
  const user = await UserModel.findById(req.user!.id).select("-passwordHash");
  res.json({ user });
});

app.patch("/api/account/profile", authenticate, validate(z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional()
})), async (req: AuthRequest, res) => {
  const user = await UserModel.findByIdAndUpdate(req.user!.id, req.body, { new: true }).select("-passwordHash");
  res.json({ user });
});

app.put("/api/account/addresses", authenticate, validate(z.object({
  addresses: z.array(z.object({
    label: z.string().max(40).default(""),
    recipient: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(6).max(30),
    line1: z.string().trim().min(3).max(250),
    city: z.string().trim().min(2).max(100),
    postalCode: z.string().max(20).default("")
  })).max(10)
})), async (req: AuthRequest, res) => {
  const user = await UserModel.findByIdAndUpdate(req.user!.id, { addresses: req.body.addresses }, { new: true }).select("-passwordHash");
  res.json({ user });
});

app.put("/api/account/wishlist", authenticate, validate(z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) })), async (req: AuthRequest, res) => {
  const productId = req.body.productId as string;
  if (!(await ProductModel.exists({ _id: productId, active: true }))) { res.status(404).json({ error: "Product not found." }); return; }
  const user = await UserModel.findById(req.user!.id);
  if (!user) { res.status(404).json({ error: "Account not found." }); return; }
  const exists = user.wishlist.some((id: mongoose.Types.ObjectId) => id.toString() === productId);
  user.wishlist = exists ? user.wishlist.filter((id: mongoose.Types.ObjectId) => id.toString() !== productId) : [...user.wishlist, new mongoose.Types.ObjectId(productId)];
  await user.save();
  res.json({ wishlist: user.wishlist });
});

app.get("/api/cart", authenticate, async (req: AuthRequest, res) => {
  const cart = await CartModel.findOne({ user: req.user!.id }).populate("items.product");
  res.json({ cart: cart ?? { items: [] } });
});

app.put("/api/cart", authenticate, validate(z.object({
  items: z.array(z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().int().min(1).max(50) })).max(50)
})), async (req: AuthRequest, res) => {
  const items = req.body.items as Array<{ productId: string; quantity: number }>;
  const ids = items.map((item) => item.productId);
  const products = await ProductModel.find({ _id: { $in: ids }, active: true }).select("_id");
  if (products.length !== new Set(ids).size) { res.status(400).json({ error: "Your cart contains a product that is no longer available." }); return; }
  const cart = await CartModel.findOneAndUpdate(
    { user: req.user!.id },
    { user: req.user!.id, items: items.map((item) => ({ product: item.productId, quantity: item.quantity })) },
    { upsert: true, new: true, runValidators: true }
  ).populate("items.product");
  res.json({ cart });
});

app.post("/api/orders", authenticate, validate(z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email(),
    phone: z.string().trim().min(6).max(30),
    address: z.string().trim().min(5).max(250),
    city: z.string().trim().min(2).max(100)
  }),
  items: z.array(z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().int().min(1).max(50) })).min(1).max(50),
  paymentMethod: z.literal("cod")
})), async (req: AuthRequest, res) => {
  const savedCheckoutSettings = await SettingsModel.findOne({ key: "checkout" }).select("value");
  const parsedCheckoutSettings = checkoutSettingsSchema.safeParse(savedCheckoutSettings?.value);
  if (!parsedCheckoutSettings.success) {
    res.status(503).json({ error: "Checkout is not ready yet. The store administrator must configure delivery charges in Store settings." });
    return;
  }
  const checkoutSettings = parsedCheckoutSettings.data;
  const { customer, items } = req.body as z.infer<typeof registerSchema> & {
    customer: { name: string; email: string; phone: string; address: string; city: string };
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: "cod";
  };
  const session = await mongoose.startSession();
  try {
    let created: unknown;
    await session.withTransaction(async () => {
      const orderItems = [];
      let subtotal = 0;
      for (const item of items) {
        const product = await ProductModel.findOneAndUpdate(
          { _id: item.productId, active: true, price: { $ne: null }, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );
        if (!product || product.price == null) throw new Error("An item is unavailable, out of stock, or does not yet have a confirmed price.");
        subtotal += product.price * item.quantity;
        orderItems.push({
          product: product._id, name: product.name, image: product.image,
          quantity: item.quantity, unitPrice: product.price, weight: product.weight
        });
      }
      const shipping = checkoutSettings.delivery.freeDeliveryMinimumSubtotal !== null
        && subtotal >= checkoutSettings.delivery.freeDeliveryMinimumSubtotal
        ? 0
        : checkoutSettings.delivery.baseFee;
      const taxRate = checkoutSettings.vat.enabled ? checkoutSettings.vat.ratePercent : 0;
      const tax = Math.round(subtotal * taxRate) / 100;
      const [order] = await OrderModel.create([{
        orderNumber: `RSH-${Date.now().toString(36).toUpperCase()}-${randomBytes(6).toString("hex").toUpperCase()}`,
        user: req.user!.id, customer, items: orderItems, subtotal, shipping, tax, taxRate, total: subtotal + shipping + tax, paymentMethod: "cod"
      }], { session });
      await CartModel.findOneAndUpdate({ user: req.user!.id }, { items: [] }, { session });
      created = order;
    });
    res.status(201).json({ order: created });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("An item is unavailable")) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  } finally {
    await session.endSession();
  }
});

app.get("/api/orders", authenticate, async (req: AuthRequest, res) => {
  const orders = await OrderModel.find({ user: req.user!.id }).sort({ createdAt: -1 }).limit(100);
  res.json({ orders });
});

app.get("/api/orders/track/:orderNumber", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false }), async (req, res) => {
  const order = await OrderModel.findOne({ orderNumber: req.params.orderNumber }).select("orderNumber status createdAt updatedAt");
  if (!order) { res.status(404).json({ error: "No order was found with that number." }); return; }
  res.json({ order });
});

const admin = [authenticate, requireAdmin] as const;
app.get("/api/admin/summary", ...admin, async (_req, res) => {
  const [products, customers, orders, revenue, recentOrders] = await Promise.all([
    ProductModel.countDocuments(),
    UserModel.countDocuments({ role: "customer" }),
    OrderModel.countDocuments(),
    OrderModel.aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    OrderModel.find().sort({ createdAt: -1 }).limit(8)
  ]);
  res.json({ summary: { products, customers, orders, revenue: revenue[0]?.total ?? 0, recentOrders } });
});

app.get("/api/admin/products", ...admin, async (_req, res) => res.json({ products: await ProductModel.find().sort({ createdAt: -1 }) }));
app.post("/api/admin/products", ...admin, validate(productSchema), async (req, res) => {
  if (await ProductModel.exists({ slug: req.body.slug })) {
    res.status(409).json({ error: "A product already uses this URL slug. Choose a unique slug." });
    return;
  }
  const product = await ProductModel.create(req.body);
  res.status(201).json({ product });
});
app.patch("/api/admin/products/:id", ...admin, validate(productSchema.partial()), async (req, res) => {
  const product = await ProductModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) { res.status(404).json({ error: "Product not found." }); return; }
  res.json({ product });
});
app.delete("/api/admin/products/:id", ...admin, async (req, res) => {
  const product = await ProductModel.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!product) { res.status(404).json({ error: "Product not found." }); return; }
  res.json({ product, message: "Product hidden from the storefront." });
});
app.get("/api/admin/recipes", ...admin, async (_req, res) => res.json({ recipes: await RecipeModel.find().sort({ title: 1 }) }));
app.post("/api/admin/recipes", ...admin, validate(recipeSchema), async (req, res) => {
  const recipe = await RecipeModel.create(req.body);
  res.status(201).json({ recipe });
});
app.patch("/api/admin/recipes/:id", ...admin, validate(recipeSchema.partial()), async (req, res) => {
  const recipe = await RecipeModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!recipe) { res.status(404).json({ error: "Recipe not found." }); return; }
  res.json({ recipe });
});
app.delete("/api/admin/recipes/:id", ...admin, async (req, res) => {
  const recipe = await RecipeModel.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!recipe) { res.status(404).json({ error: "Recipe not found." }); return; }
  res.json({ recipe, message: "Recipe hidden from the storefront." });
});
app.get("/api/admin/orders", ...admin, async (_req, res) => res.json({ orders: await OrderModel.find().sort({ createdAt: -1 }).limit(300) }));
app.get("/api/admin/reviews", ...admin, async (_req, res) => {
  const reviews = await ReviewModel.find().populate("user", "name email").populate("product", "name slug").sort({ createdAt: -1 }).limit(300);
  res.json({ reviews });
});
app.patch("/api/admin/reviews/:id", ...admin, validate(z.object({ status: z.enum(["approved", "rejected"]) })), async (req, res) => {
  const review = await ReviewModel.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!review) { res.status(404).json({ error: "Review not found." }); return; }
  res.json({ review });
});
app.patch("/api/admin/orders/:id", ...admin, validate(z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"])
})), async (req, res) => {
  const session = await mongoose.startSession();
  let updated;
  try {
    await session.withTransaction(async () => {
      const order = await OrderModel.findById(req.params.id).session(session);
      if (!order) throw new Error("ORDER_NOT_FOUND");
      const nextStatus = req.body.status as string;
      if (order.status !== nextStatus && order.status === "cancelled") {
        for (const item of order.items) {
          if (!item.product) continue;
          const product = await ProductModel.findOneAndUpdate(
            { _id: item.product, active: true, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true, session }
          );
          if (!product) throw new Error("ORDER_RESTOCK_UNAVAILABLE");
        }
      } else if (order.status !== nextStatus && nextStatus === "cancelled") {
        for (const item of order.items) {
          if (item.product) await ProductModel.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }, { session });
        }
      }
      order.status = nextStatus as typeof order.status;
      updated = await order.save({ session });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") { res.status(404).json({ error: "Order not found." }); return; }
    if (error instanceof Error && error.message === "ORDER_RESTOCK_UNAVAILABLE") { res.status(409).json({ error: "This order cannot be reopened because one or more products do not have enough stock." }); return; }
    throw error;
  } finally {
    await session.endSession();
  }
  res.json({ order: updated });
});
app.get("/api/admin/customers", ...admin, async (_req, res) => res.json({
  customers: await UserModel.find({ role: "customer" }).select("name email phone createdAt").sort({ createdAt: -1 }).limit(500)
}));
app.get("/api/admin/categories", ...admin, async (_req, res) => res.json({ categories: await CategoryModel.find().sort({ name: 1 }) }));
app.get("/api/admin/messages", ...admin, async (_req, res) => res.json({ messages: await ContactMessageModel.find().sort({ createdAt: -1 }).limit(300) }));
app.patch("/api/admin/messages/:id", ...admin, validate(z.object({ status: z.enum(["new", "read", "resolved"]) })), async (req, res) => {
  const message = await ContactMessageModel.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!message) { res.status(404).json({ error: "Message not found." }); return; }
  res.json({ message });
});
const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});
app.post("/api/admin/categories", ...admin, validate(categorySchema), async (req, res) => {
  const category = await CategoryModel.create(req.body);
  res.status(201).json({ category });
});
app.patch("/api/admin/categories/:id", ...admin, validate(categorySchema), async (req, res) => {
  const session = await mongoose.startSession();
  let category;
  try {
    await session.withTransaction(async () => {
      const current = await CategoryModel.findById(req.params.id).session(session);
      if (!current) throw new Error("CATEGORY_NOT_FOUND");
      if (current.name !== req.body.name) {
        await ProductModel.updateMany({ category: current.name }, { category: req.body.name }, { session });
      }
      current.name = req.body.name;
      current.slug = req.body.slug;
      category = await current.save({ session });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") { res.status(404).json({ error: "Category not found." }); return; }
    throw error;
  } finally {
    await session.endSession();
  }
  res.json({ category });
});
app.delete("/api/admin/categories/:id", ...admin, async (req, res) => {
  const category = await CategoryModel.findById(req.params.id);
  if (!category) { res.status(404).json({ error: "Category not found." }); return; }
  if (await ProductModel.exists({ category: category.name })) {
    res.status(409).json({ error: "This category still has products. Move those products to another category before removing it." });
    return;
  }
  await category.deleteOne();
  res.json({ message: "Category removed." });
});
app.get("/api/admin/settings", ...admin, async (_req, res) => res.json({ settings: await SettingsModel.find().sort({ key: 1 }) }));
app.put("/api/admin/settings/:key", ...admin, validate(z.object({ value: z.record(z.unknown()) })), async (req: Request, res: Response) => {
  if (req.params.key === "checkout") {
    const parsed = checkoutSettingsSchema.safeParse(req.body.value);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues.map((issue) => issue.message).join(" ") });
      return;
    }
    req.body.value = parsed.data;
  }
  const setting = await SettingsModel.findOneAndUpdate({ key: req.params.key }, { key: req.params.key, value: req.body.value }, { upsert: true, new: true });
  res.json({ setting });
});

app.use((_req: Request, res: Response) => res.status(404).json({ error: "The requested API route was not found." }));
const errorHandler: ErrorRequestHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    res.status(400).json({ error: "The request body contains invalid JSON." });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "Please check the submitted information.", details: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })) });
    return;
  }
  if (error instanceof mongoose.Error.ValidationError) { res.status(400).json({ error: error.message }); return; }
  if (error instanceof mongoose.Error.CastError) { res.status(400).json({ error: "Invalid resource identifier." }); return; }
  if ((error as { code?: number }).code === 11000) {
    const keyPattern = (error as { keyPattern?: Record<string, unknown> }).keyPattern;
    if (keyPattern?.slug) { res.status(409).json({ error: "That URL slug is already in use. Choose a unique slug." }); return; }
    res.status(409).json({ error: "That record already exists." });
    return;
  }
  console.error("Unhandled API error:", error);
  res.status(500).json({ error: "An unexpected server error occurred." });
};
app.use(errorHandler);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("Set JWT_SECRET to a value containing at least 32 characters.");
if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI before starting the API.");

await connectDatabase(process.env.MONGODB_URI);
const database = mongoose.connection.db;
if (!database) throw new Error("MongoDB connected without an active database.");
const orderCollectionExists = await database
  .listCollections({ name: OrderModel.collection.collectionName }, { nameOnly: true })
  .hasNext();
if (orderCollectionExists) {
  const orderIndexes = await OrderModel.collection.indexes();
  const obsoleteReferenceIndex = orderIndexes.find((index) =>
    index.name === "reference_1" &&
    index.unique === true &&
    Object.keys(index.key).length === 1 &&
    index.key.reference === 1
  );
  if (obsoleteReferenceIndex?.name) {
    try {
      await OrderModel.collection.dropIndex(obsoleteReferenceIndex.name);
      console.warn("Removed obsolete unique orders index on reference.");
    } catch (error) {
      if (
        typeof error !== "object" ||
        error === null ||
        !("code" in error) ||
        error.code !== 27
      ) {
        throw error;
      }
    }
  }
}
await seedStore();
const server = app.listen(port, () => console.info(`Roshona API listening on port ${port}`));
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the other Roshona API process or set PORT to an unused port before starting another instance.`);
    process.exit(1);
  }
  console.error("Could not start the Roshona API:", error);
  process.exit(1);
});
