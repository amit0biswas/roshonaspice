import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Instagram, Leaf, Mail, MapPin, Menu, Minus, Package,
  Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Truck, UserRound, X, Heart, Star, Quote,
  LayoutDashboard, Boxes, ClipboardList, UsersRound, Settings, BarChart3, MessageSquareText, RefreshCw,
  CheckCircle2, CreditCard
} from "lucide-react";
import { apiRequest, useStore, type Product, type Recipe, type Review } from "./store";

const images = {
  hero: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=85",
  collection: "/assets/Roshona Bengali Spice Collection.png",
  logo: "/assets/logo.png"
};
const productImageFallbacks: Record<string, string> = {
  "garam-masala": "/assets/Roshona Garam Masala Spice Jar.png",
  "turmeric-powder": "/assets/Roshona Turmeric Powder Jar.png",
  "coriander-powder": "/assets/Roshona Coriander Powder Jar.png",
  "red-chili-powder": "/assets/Roshona Red Chilli Powder Jar.png",
  "red-chilli-powder": "/assets/Roshona Red Chilli Powder Jar.png",
  "cumin-powder": "/assets/Roshona Cumin Powder Jar on Red.png"
};
const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/shop", label: "Shop" },
  { to: "/our-story", label: "Our Story" },
  { to: "/recipes", label: "Recipes" },
  { to: "/contact", label: "Contact" }
];
const taka = (amount: number) => `৳${amount.toLocaleString("en-BD")}`;
function normalizeProductImage(value: string): string {
  const image = value.trim();
  if (!image || /^https?:\/\//i.test(image)) return image;
  let path = image.replace(/\\/g, "/").replace(/^\.\//, "");
  if (/^file:/i.test(path)) {
    try { path = decodeURIComponent(new URL(path).pathname); } catch { return image; }
  }
  const publicAsset = path.match(/(?:^|\/)(?:frontend\/)?(?:public|dist)\/assets\/(.+)$/i)?.[1]
    ?? path.match(/(?:^|\/)assets\/(.+)$/i)?.[1];
  if (publicAsset) path = `assets/${publicAsset}`;
  else if (/^[a-z]:\//i.test(path)) return image;
  const relative = path.match(/^(?:frontend\/)?public\/(.*)$/i)?.[1] ?? path.replace(/^\/?/, "");
  const encodedPath = relative.split("/").map((part) => {
    try { return encodeURIComponent(decodeURIComponent(part)); } catch { return encodeURIComponent(part); }
  }).join("/");
  return `/${encodedPath}`;
}
function productImageSource(product: Pick<Product, "image" | "slug">): string {
  return normalizeProductImage(product.image) || productImageFallbacks[product.slug] || images.collection;
}

function Shell({ children }: { children: ReactNode }) {
  const { cart, notice } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(searchValue)}`);
    setSearchOpen(false);
  };
  return <div className="site-shell">
    <div className="announcement"><span><Truck size={12} /> Spices for the flavours of home</span><span className="announcement-center">THE ART OF SPICE · BANGLADESH</span><span className="announcement-social">Follow our story <Instagram size={13} /></span></div>
    <header className="site-header">
      <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <Link to="/" className="brand" aria-label="Roshona home"><img src={images.logo} alt="Roshona" /><span>THE ART OF SPICE</span></Link>
      <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
        {navLinks.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)}>{item.label}</NavLink>)}
      </nav>
      <div className="header-actions">
        <button className="icon-button" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><Search size={19} /></button>
        <Link className="icon-button" aria-label="My account" to="/account"><UserRound size={19} /></Link>
        <Link className="icon-button bag-icon" aria-label={`Shopping bag, ${cartCount} items`} to="/cart"><ShoppingBag size={19} />{cartCount > 0 && <span className="bag-count">{cartCount}</span>}</Link>
      </div>
      {searchOpen && <form className="search-panel" onSubmit={submitSearch}><Search size={18} /><input autoFocus placeholder="Search our collection…" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} /><button type="submit" className="button button-red">Search</button><button type="button" className="icon-button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={17} /></button></form>}
    </header>
    {children}
    <footer className="footer"><div className="footer-main"><div className="footer-brand"><Link to="/" className="brand footer-mark"><img src={images.logo} alt="Roshona" /></Link><p>A little more soul in every spoonful.</p><p className="muted">A collection of spices for the recipes, memories and meals that feel like home.</p></div><div className="footer-column"><h4>Explore</h4><Link to="/shop">Shop spices</Link><Link to="/our-story">Our story</Link><Link to="/recipes">Recipes</Link><Link to="/contact">Contact</Link></div><div className="footer-column"><h4>Here to help</h4><Link to="/faq">Frequently asked questions</Link><Link to="/shipping">Delivery information</Link><Link to="/returns">Returns & refunds</Link><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms</Link></div><div className="footer-column"><h4>Say hello</h4><Link to="/contact"><Mail size={15} /> Send us a note</Link><Link to="/contact"><MapPin size={15} /> Bangladesh</Link><a href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Roshona. The art of spice.</span><span>Made for the flavours of home <span className="gold-dot">✳</span></span></div></footer>
    {notice && <div role="status" className="toast"><Check size={17} /> {notice}</div>}
  </div>;
}
function HomePage() {
  const { products } = useStore();
  const heroProducts = products.filter((product) => product.active);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroProduct = heroProducts[heroIndex % Math.max(heroProducts.length, 1)];
  const showPreviousHeroProduct = () => setHeroIndex((index) => (index - 1 + heroProducts.length) % heroProducts.length);
  const showNextHeroProduct = () => setHeroIndex((index) => (index + 1) % heroProducts.length);
  return <>
    <main>
      <section className="hero-product-carousel" aria-label="Featured spices">
        <div className="hero-product-copy" key={heroProduct?._id ?? "collection"}>
          <span className="eyebrow">HANDPICKED SPICES · ROSHONA</span>
          <h1>{heroProduct ? heroProduct.name : "Spices for home"}<em>.</em></h1>
          <p>{heroProduct?.description && heroProduct.description !== heroProduct.name
            ? heroProduct.description
            : "Discover a thoughtfully chosen spice for the flavours and recipes you love."}</p>
          {heroProduct?.price != null && <span className="hero-product-price">{taka(heroProduct.price)} <small>/ {heroProduct.weight}</small></span>}
          <div className="hero-product-actions">
            {heroProduct && <Link to={`/product/${heroProduct.slug}`} className="button button-red">Discover spice <ArrowRight size={16} /></Link>}
            <Link to="/shop" className="hero-secondary-link">Explore the collection</Link>
          </div>
          <span className="hero-product-note"><span /> THE ART OF SPICE · BANGLADESH</span>
        </div>
        <div className="hero-product-visual">
          <span className="hero-visual-wash" aria-hidden="true" />
          {heroProduct && <img key={heroProduct._id} className="hero-product-image" src={productImageSource(heroProduct)} alt={heroProduct.name} loading="eager" />}
          <span className="hero-visual-label">ROSHONA <i>✳</i> THE ART OF SPICE</span>
        </div>
        {heroProducts.length > 1 && <>
          <button className="hero-carousel-arrow hero-carousel-prev" type="button" aria-label="Previous featured spice" onClick={showPreviousHeroProduct}><ArrowLeft size={17} /></button>
          <button className="hero-carousel-arrow hero-carousel-next" type="button" aria-label="Next featured spice" onClick={showNextHeroProduct}><ArrowRight size={17} /></button>
          <div className="hero-carousel-dots" role="group" aria-label="Choose featured spice">
            {heroProducts.map((product, index) => <button key={product._id} type="button" aria-label={`Show ${product.name}`} aria-pressed={index === heroIndex % heroProducts.length} className={index === heroIndex % heroProducts.length ? "active" : ""} onClick={() => setHeroIndex(index)} />)}
          </div>
        </>}
      </section>
      <section className="promise-strip"><div><span className="promise-icon"><Leaf /></span><span><strong>A pantry full of possibility</strong><small>Spices for all your everyday rituals</small></span></div><div><span className="promise-icon"><Sparkles /></span><span><strong>The familiar, thoughtfully chosen</strong><small>Discover a collection of classics</small></span></div><div><span className="promise-icon"><Heart /></span><span><strong>Rooted in the recipes we love</strong><small>Made for flavours that feel like home</small></span></div><div><span className="promise-icon"><Package /></span><span><strong>Here for your daily table</strong><small>Find your new kitchen favourites</small></span></div></section>
      <section className="section collection-section"><div className="section-heading"><div><span className="eyebrow">THE PANTRY EDIT · 01</span><h2>A collection of <em>classics</em></h2><p>Start with the spices at the heart of a hundred favourite recipes.</p></div><Link to="/shop" className="text-link">View the collection <ArrowRight size={17} /></Link></div><ProductGrid products={products.slice(0, 4)} /></section>
      <section className="brand-story-section">
        <div className="brand-story-visual"><img src={images.collection} alt="A colourful selection of Roshona spices" /><span className="story-badge"><span>THE</span><strong>Art of<br />Spice</strong><span>ROSHONA · BANGLADESH</span></span><Leaf className="story-leaf story-leaf-one" aria-hidden="true" /><Leaf className="story-leaf story-leaf-two" aria-hidden="true" /></div>
        <div className="brand-story-copy"><span className="eyebrow">OUR STORY · ROOTED IN BANGLADESH</span><h2>A Taste of Bangladesh,<br />A Story of <em>Spice</em></h2><p>Roshona brings the warmth of traditional Bangladeshi spices to your kitchen. Inspired by generations of culinary heritage, we bring together rich aromas and authentic flavours to make every meal memorable.</p><Link to="/about" className="button button-red">Discover Our Story <ArrowRight size={16} /></Link></div>
      </section>
      <HomeRecipesSection />
      <ReviewsCarousel />
      <section className="closing-note"><span className="closing-star">✳</span><span className="eyebrow">AN INVITATION TO YOUR TABLE</span><h2>Find your new <em>favourite.</em></h2><Link to="/shop" className="button button-red">Discover the collection <ArrowRight size={17} /></Link></section>
    </main>
  </>;
}

function RecipeCard({ recipe, featured = false }: { recipe: Recipe; featured?: boolean }) {
  const { recipeWishlist, toggleRecipeWishlist } = useStore();
  const saved = recipeWishlist.includes(recipe._id);
  return <article className={`recipe-feature-card${featured ? " recipe-feature-card-large" : ""}`}>
    <Link to={`/recipes/${recipe.slug}`} className="recipe-feature-image"><img loading="lazy" src={recipe.image} alt={recipe.imageAlt} /><span className="recipe-image-time"><Clock3 size={13} /> {recipe.prepMinutes} min</span></Link>
    <button className={`wishlist-button recipe-save${saved ? " is-saved" : ""}`} aria-label={`${saved ? "Remove" : "Save"} ${recipe.title} ${saved ? "from" : "to"} favourites`} aria-pressed={saved} onClick={() => void toggleRecipeWishlist(recipe._id)}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>
    <div className="recipe-feature-copy"><span className="eyebrow">FROM THE ROSHONA KITCHEN</span><h3><Link to={`/recipes/${recipe.slug}`}>{recipe.title}</Link></h3><p>{recipe.description}</p><Link to={`/recipes/${recipe.slug}`} className="recipe-card-link" aria-label={`Read ${recipe.title} recipe`}><span>Read the recipe</span><ArrowRight size={17} /></Link></div>
  </article>;
}

function HomeRecipesSection() {
  const { request } = useStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadRecipes = useCallback(async () => {
    setLoading(true); setError("");
    try { setRecipes((await request<{ recipes: Recipe[] }>("/recipes")).recipes.slice(0, 3)); }
    catch (e) { setError(e instanceof Error ? e.message : "We could not load the recipes."); }
    finally { setLoading(false); }
  }, [request]);
  useEffect(() => { void loadRecipes(); }, [loadRecipes]);
  return <section className="home-recipes-section">
    <div className="home-recipes-inner"><div className="home-recipes-heading"><div><span className="eyebrow">FROM THE ROSHONA KITCHEN · 03 RECIPES</span><h2>Inspiration for <em>Every Dish</em></h2><p>Discover delicious recipes made with Roshona spices and bring new flavour to your table.</p></div><Link to="/recipes" className="text-link">Explore all recipes <ArrowRight size={16} /></Link></div>
      {loading && <div className="section-feedback" role="status"><span className="spinner" /> Finding something lovely…</div>}
      {error && <div className="section-feedback section-feedback-error" role="alert">{error}<button className="text-link" onClick={() => void loadRecipes()}>Try again <ArrowRight size={15} /></button></div>}
      {!loading && !error && recipes.length > 0 && <div className="recipe-feature-grid">{recipes.map((recipe) => <RecipeCard key={recipe._id} recipe={recipe} />)}</div>}
      {!loading && !error && !recipes.length && <div className="section-feedback">Our recipe journal is being prepared. <Link to="/recipes" className="text-link">Visit the recipe page <ArrowRight size={15} /></Link></div>}
      <Link to="/recipes" className="button button-outline home-recipes-cta">Explore All Recipes <ArrowRight size={16} /></Link>
    </div>
  </section>;
}

function ReviewsCarousel() {
  const { request } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadReviews = useCallback(async () => {
    setLoading(true); setError("");
    try { setReviews((await request<{ reviews: Review[] }>("/reviews?limit=12")).reviews); setIndex(0); }
    catch (e) { setError(e instanceof Error ? e.message : "Customer reviews are temporarily unavailable."); }
    finally { setLoading(false); }
  }, [request]);
  useEffect(() => { void loadReviews(); }, [loadReviews]);
  const visible = reviews.length ? reviews[index % reviews.length] : null;
  const move = (direction: number) => setIndex((current) => (current + direction + reviews.length) % reviews.length);
  return <section className="reviews-section" aria-labelledby="reviews-title"><div className="reviews-inner"><div className="reviews-heading"><span className="eyebrow">KIND WORDS, REAL EXPERIENCES</span><h2 id="reviews-title">What Our Customers <em>Say</em></h2><p>Shared by customers after their delivered orders.</p></div>
    {loading && <div className="section-feedback" role="status"><span className="spinner" /> Gathering customer stories…</div>}
    {error && <div className="section-feedback section-feedback-error" role="alert">{error}<button className="text-link" onClick={() => void loadReviews()}>Try again <ArrowRight size={15} /></button></div>}
    {!loading && !error && visible && <div className="review-carousel"><button className="review-arrow" aria-label="Previous customer review" onClick={() => move(-1)} disabled={reviews.length < 2}><ArrowLeft size={19} /></button><article className="review-card" aria-live="polite"><Quote className="review-quote-icon" size={30} aria-hidden="true" /><div className="review-stars" aria-label={`${visible.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={15} fill={i < visible.rating ? "currentColor" : "none"} />)}</div><blockquote>“{visible.comment}”</blockquote><div className="review-attribution"><strong>{visible.user?.name || "Verified customer"}</strong><span>{visible.productName} · Verified purchase</span></div><span className="review-position">{String(index + 1).padStart(2, "0")} <span>/</span> {String(reviews.length).padStart(2, "0")}</span></article><button className="review-arrow" aria-label="Next customer review" onClick={() => move(1)} disabled={reviews.length < 2}><ArrowRight size={19} /></button></div>}
    {!loading && !error && !visible && <div className="reviews-empty"><MessageSquareText size={23} /><p>Customer reviews will appear here after verified purchases are approved.</p></div>}
    {!loading && !error && reviews.length > 1 && <div className="review-dots" role="group" aria-label="Choose a customer review">{reviews.map((review, reviewIndex) => <button key={review._id} className={reviewIndex === index ? "active" : ""} aria-label={`Show review ${reviewIndex + 1}`} aria-pressed={reviewIndex === index} onClick={() => setIndex(reviewIndex)} />)}</div>}
  </div></section>;
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  return <article className="product-card"><div className="product-image-wrap"><Link to={`/product/${product.slug}`} className="product-image"><img loading="lazy" src={productImageSource(product)} alt={product.name} /></Link><button className={`wishlist-button ${wishlist.includes(product._id) ? "is-saved" : ""}`} onClick={() => void toggleWishlist(product)} aria-label={`Save ${product.name}`}><Heart size={17} fill={wishlist.includes(product._id) ? "currentColor" : "none"} /></button></div><div className="product-meta"><span className="product-category">{product.category}</span><Link to={`/product/${product.slug}`} className="product-name">{product.name}</Link><span className="product-weight">Pack size · {product.weight}</span><div className="product-price-row"><span className="product-price">{product.price != null ? taka(product.price) : "Price to be confirmed"}</span><button className="add-button" aria-label={`Add ${product.name} to bag`} disabled={product.price == null || product.stock < 1} onClick={() => addToCart(product)} title={product.stock < 1 ? "Stock not yet confirmed" : undefined}><Plus size={18} /></button></div>{product.stock < 1 && <span className="product-stock-note">Availability to be confirmed</span>}</div></article>;
}
function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return <div className="empty-state">No spices found. Try another search.</div>;
  return <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>;
}
function PageIntro({ kicker, title, subtitle }: { kicker: string; title: ReactNode; subtitle?: string }) {
  return <div className="page-intro"><span className="eyebrow">{kicker}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>;
}
function ShopPage() {
  const { products, loading } = useStore();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "All spices";
  const categories = ["All spices", "Ground Spices", "Blended Spices"];
  const filtered = useMemo(() => products.filter((product) =>
    (category === "All spices" || product.category === category)
    && (!query || `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase()))
  ), [products, category, query]);
  return <main className="page"><PageIntro kicker="A PANTRY FULL OF POSSIBILITY" title={<>The spice <em>collection.</em></>} subtitle="A gathering of familiar favourites, ready for your everyday recipes." /><div className="shop-tools"><div className="filter-tabs">{categories.map((item) => <button key={item} className={category === item ? "filter-tab active" : "filter-tab"} onClick={() => { const next = new URLSearchParams(params); item === "All spices" ? next.delete("category") : next.set("category", item); setParams(next); }}>{item}</button>)}</div><span className="results-count">{query ? `SEARCHING “${query}” · ` : ""}{filtered.length} SPICES</span></div>{loading && <div className="loading-note"><span className="spinner" /> Finding something lovely…</div>}<ProductGrid products={filtered} /><p className="catalog-note">Prices and stock are configured by the store. Products are not available to order until both have been confirmed.</p></main>;
}

function ProductPage() {
  const { slug } = useParams();
  const { products, addToCart } = useStore();
  const product = products.find((entry) => entry.slug === slug);
  if (!product) return <NotFoundPage />;
  return <main className="page product-detail"><Link to="/shop" className="back-link"><ArrowLeft size={16} /> Back to the collection</Link><div className="product-detail-grid"><div className="product-detail-image"><img src={productImageSource(product)} alt={product.name} /></div><div className="product-detail-info"><span className="eyebrow">{product.category.toUpperCase()} · ROSHONA</span><h1>{product.name}<em>.</em></h1><p className="detail-weight">Pack size · {product.weight}</p><p className="detail-price">{product.price != null ? taka(product.price) : "Price to be confirmed"}</p><div className="detail-rule" /><p className="detail-description">{product.description}</p><button className="button button-red detail-add" disabled={product.price == null || product.stock < 1} onClick={() => addToCart(product)}>{product.price == null ? <>Price coming soon <Clock3 size={16} /></> : product.stock < 1 ? <>Availability to be confirmed <Clock3 size={16} /></> : <>Add to your bag · {taka(product.price)} <ShoppingBag size={17} /></>}</button><p className="detail-note"><ShieldCheck size={16} /> Secure checkout · Cash on delivery</p><div className="detail-faq"><details><summary>A spice for every day <ChevronDown size={16} /></summary><p>A familiar favourite for the dishes you love to make.</p></details><details><summary>Delivery information <ChevronDown size={16} /></summary><p><Link to="/shipping">See our delivery information.</Link> Delivery rates and timings have not yet been confirmed.</p></details></div></div></div><ProductReviews product={product} /></main>;
}

function ProductReviews({ product }: { product: Product }) {
  const { request, user, flash } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligible, setEligible] = useState<{ eligible: boolean; reason: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [error, setError] = useState("");
  const loadReviews = useCallback(async () => {
    setLoading(true); setError("");
    try { setReviews((await request<{ reviews: Review[] }>(`/products/${encodeURIComponent(product.slug)}/reviews`)).reviews); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load reviews."); }
    finally { setLoading(false); }
  }, [product.slug, request]);
  useEffect(() => { void loadReviews(); }, [loadReviews]);
  useEffect(() => {
    if (!user) { setEligible(null); return; }
    let cancelled = false;
    void request<{ eligible: boolean; reason: string | null }>(`/reviews/eligibility/${product._id}`)
      .then((result) => { if (!cancelled) setEligible(result); })
      .catch((e: unknown) => { if (!cancelled) setEligible({ eligible: false, reason: e instanceof Error ? e.message : "Could not check review eligibility." }); });
    return () => { cancelled = true; };
  }, [product._id, request, user]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    try {
      const comment = String(new FormData(form).get("comment"));
      const result = await request<{ message: string }>("/reviews", { method: "POST", body: JSON.stringify({ productId: product._id, rating, comment }) });
      form.reset(); setEligible({ eligible: false, reason: "Your verified review is awaiting moderation." }); flash(result.message);
    } catch (e) { flash(e instanceof Error ? e.message : "Could not submit your review."); }
    finally { setBusy(false); }
  }
  return <section className="product-reviews" id="reviews"><div className="product-reviews-heading"><span className="eyebrow">VERIFIED CUSTOMER EXPERIENCES</span><h2>Reviews for <em>{product.name}</em></h2></div>
    {loading && <p className="muted" role="status">Loading customer reviews…</p>}
    {error && <p className="form-error" role="alert">{error} <button className="text-link" onClick={() => void loadReviews()}>Try again</button></p>}
    {!loading && !error && (reviews.length ? <div className="product-review-list">{reviews.map((review) => <article className="product-review" key={review._id}><div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />)}</div><p>{review.comment}</p><span>{review.user?.name || "Verified customer"} · {new Date(review.createdAt).toLocaleDateString("en-GB")}</span></article>)}</div> : <p className="muted">No approved reviews yet. Reviews from verified purchases appear here after moderation.</p>)}
    {!user && <p className="review-eligibility-note"><Link to="/account">Sign in</Link> after a delivered order to share a verified review.</p>}
    {user && eligible?.eligible && <form className="review-form" onSubmit={(e) => void submit(e)}><h3>Share your experience</h3><label>Your rating</label><div className="rating-input" role="group" aria-label="Choose a rating">{Array.from({ length: 5 }, (_, i) => <button type="button" key={i} aria-label={`${i + 1} star${i ? "s" : ""}`} aria-pressed={rating === i + 1} onClick={() => setRating(i + 1)}><Star size={20} fill={rating >= i + 1 ? "currentColor" : "none"} /></button>)}</div><label htmlFor={`review-comment-${product._id}`}>Your review<textarea id={`review-comment-${product._id}`} name="comment" required minLength={10} maxLength={1200} rows={4} placeholder="What did you think of this spice?" /></label><button className="button button-red" disabled={busy}>{busy ? "Sending…" : "Submit verified review"} <ArrowRight size={15} /></button></form>}
    {user && eligible && !eligible.eligible && eligible.reason && <p className="review-eligibility-note">{eligible.reason}</p>}
  </section>;
}

type CheckoutSettings = {
  delivery: { baseFee: number; freeDeliveryMinimumSubtotal: number | null };
  vat: { enabled: boolean; ratePercent: number };
};

function CartPage() {
  const { cart, changeQuantity, removeFromCart, clearCart, request, flash, user } = useStore();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  useEffect(() => {
    void apiRequest<{ checkout: CheckoutSettings | null }>("/storefront/settings")
      .then(({ checkout }) => setCheckoutSettings(checkout))
      .catch((error: unknown) => setSettingsError(error instanceof Error ? error.message : "Could not load checkout settings."))
      .finally(() => setSettingsLoading(false));
  }, []);
  const subtotal = cart.reduce((sum, line) => sum + (line.product.price ?? 0) * line.quantity, 0);
  const shipping = checkoutSettings
    ? checkoutSettings.delivery.freeDeliveryMinimumSubtotal !== null && subtotal >= checkoutSettings.delivery.freeDeliveryMinimumSubtotal
      ? 0
      : checkoutSettings.delivery.baseFee
    : null;
  const tax = checkoutSettings?.vat.enabled
    ? Math.round(subtotal * checkoutSettings.vat.ratePercent) / 100
    : 0;
  const total = shipping === null ? null : subtotal + shipping + tax;
  const needsPriceConfirmation = cart.some((line) => line.product.price == null);
  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { flash("Please sign in before placing your order."); navigate("/account?next=checkout"); return; }
    if (needsPriceConfirmation) { flash("Every item needs a confirmed price before checkout."); return; }
    if (!checkoutSettings) { flash("Checkout is not ready. Please contact the store administrator."); return; }
    const form = new FormData(event.currentTarget);
    const customer = { name: String(form.get("name")), email: String(form.get("email")), phone: String(form.get("phone")), address: String(form.get("address")), city: String(form.get("city")) };
    setBusy(true);
    try {
      const result = await request<{ order: { orderNumber: string } }>("/orders", {
        method: "POST",
        body: JSON.stringify({ customer, items: cart.map((line) => ({ productId: line.product._id, quantity: line.quantity })), paymentMethod: "cod" })
      });
      clearCart();
      navigate(`/order-confirmation/${encodeURIComponent(result.order.orderNumber)}`);
    } catch (error) { flash(error instanceof Error ? error.message : "Could not place your order."); }
    finally { setBusy(false); }
  }
  if (!cart.length) return <main className="page"><PageIntro kicker="YOUR LITTLE BAG" title={<>A little room for <em>something good.</em></>} /><div className="empty-cart"><ShoppingBag size={38} /><p>Your bag is waiting for its first spice.</p><Link to="/shop" className="button button-red">Find a favourite <ArrowRight size={17} /></Link></div></main>;
  return <main className="page"><PageIntro kicker="YOUR LITTLE BAG" title={<>The good stuff, <em>gathered.</em></>} /><div className="cart-layout"><div className="cart-lines">{cart.map(({ product, quantity }) => <article key={product._id} className="cart-line"><img src={productImageSource(product)} alt="" /><div className="cart-item-info"><Link to={`/product/${product.slug}`} className="product-name">{product.name}</Link><span>{product.weight} · {product.price == null ? "Price to be confirmed" : taka(product.price)}</span><button className="remove-link" onClick={() => removeFromCart(product._id)}>Remove</button></div><div className="quantity-control"><button aria-label="Reduce quantity" onClick={() => changeQuantity(product._id, -1)}><Minus size={14} /></button><span>{quantity}</span><button aria-label="Add quantity" onClick={() => changeQuantity(product._id, 1)}><Plus size={14} /></button></div><strong>{product.price == null ? "—" : taka(product.price * quantity)}</strong></article>)}</div><form className="checkout-panel" onSubmit={(e) => void checkout(e)}><h2>A few details, then home.</h2><p>Payment method</p><div className="checkout-payment-option"><CheckCircle2 size={16} /><span>Cash on delivery <small>Available</small></span></div><div className="checkout-payment-option checkout-payment-disabled" aria-disabled="true"><CreditCard size={16} /><span>Online payment <small>Not configured yet</small></span></div><p className="checkout-payment-note">Online payments will appear here after the store completes secure setup with its payment providers.</p><label>Name<input name="name" required minLength={2} defaultValue={user?.name} /></label><label>Email<input name="email" type="email" required defaultValue={user?.email} /></label><label>Phone<input name="phone" type="tel" required minLength={6} /></label><label>Delivery address<input name="address" required minLength={5} /></label><label>City<input name="city" required /></label><div className="checkout-total"><span>Subtotal</span><strong>{taka(subtotal)}</strong></div><div className="checkout-total"><span>Delivery</span><strong>{settingsLoading ? "Loading…" : shipping === null ? "Not configured" : shipping === 0 ? "Free" : taka(shipping)}</strong></div>{checkoutSettings?.vat.enabled && <div className="checkout-total"><span>VAT ({checkoutSettings.vat.ratePercent}%)</span><strong>{taka(tax)}</strong></div>}<div className="checkout-total"><span>Total</span><strong>{settingsLoading ? "Loading…" : total === null ? "Not configured" : taka(total)}</strong></div>{settingsError && <p className="checkout-setup-message" role="alert">Checkout settings could not be loaded: {settingsError}</p>}{!settingsLoading && !settingsError && !checkoutSettings && <p className="checkout-setup-message" role="status">The store administrator needs to configure delivery charges in Admin → Store settings before orders can be accepted.</p>}{needsPriceConfirmation && <p className="checkout-setup-message" role="status">A product in your bag still needs a confirmed price. Please contact the store before ordering.</p>}<button className="button button-red checkout-submit" type="submit" disabled={busy || settingsLoading || !checkoutSettings || needsPriceConfirmation}>{busy ? "Placing your order…" : "Place cash-on-delivery order"} <ArrowRight size={16} /></button></form></div></main>;
}

function AccountPage() {
  const { request, setUser, user, flash, products } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const adminSignIn = searchParams.get("redirect") === "/admin";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<Array<{ _id: string; orderNumber: string; status: string; total: number; createdAt: string; items?: Array<{ product: string | { _id: string } | null; name: string }> }>>([]);
  useEffect(() => {
    if (adminSignIn) return;
    if (user) void apiRequest<{ orders: typeof orders }>("/orders").then((result) => setOrders(result.orders)).catch((error: Error) => flash(error.message));
  }, [adminSignIn, user, flash]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const body = mode === "login"
      ? { email: String(form.get("email")), password: String(form.get("password")) }
      : { name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")) };
    try {
      const result = await request<{ user: NonNullable<typeof user> }>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
      setUser(result.user);
      if (adminSignIn && result.user.role !== "admin") {
        navigate("/account");
        flash("This account does not have administrator access.");
        return;
      }
      navigate(result.user.role === "admin" ? "/admin" : "/account", { replace: true });
      flash(`Welcome${result.user.name ? `, ${result.user.name.split(" ")[0]}` : " to Roshona"}.`);
    } catch (error) { flash(error instanceof Error ? error.message : "Could not sign you in."); }
    finally { setBusy(false); }
  }
  if (adminSignIn) return <Navigate to="/admin" replace />;
  if (user) return <main className="page"><PageIntro kicker={user.role === "admin" ? "ROSHONA STORE ADMIN" : "YOUR ROSHONA"} title={user.role === "admin" ? <>Welcome to your <em>store.</em></> : <>Good to have you <em>here.</em></>} subtitle={`Signed in as ${user.email}`} />{user.role === "admin" && <div className="account-card admin-account-access"><h2>Store administration</h2><p>Your administrator account is ready. Open the dashboard to manage products, orders, recipes and store settings.</p><Link to="/admin" className="button button-red">Open admin dashboard <ArrowRight size={16} /></Link></div>}<div className="account-dashboard"><section className="account-card"><div className="account-card-head"><h2>Your orders</h2><Package /></div>{orders.length ? orders.map((order) => <article className="account-order-card" key={order._id}><div className="account-order"><div><strong>{order.orderNumber}</strong><span>{new Date(order.createdAt).toLocaleDateString()}</span></div><div><strong>{taka(order.total)}</strong><span className="status-pill">{order.status}</span></div></div>{order.status === "delivered" && order.items?.length ? <div className="account-order-review-links"><span>Purchased items</span>{order.items.map((item, index) => { const productId = typeof item.product === "string" ? item.product : item.product?._id; const product = products.find((entry) => entry._id === productId); return product ? <Link key={`${order._id}-${productId}-${index}`} to={`/product/${encodeURIComponent(product.slug)}#reviews`} className="text-link">Review {item.name} <ArrowRight size={14} /></Link> : <span key={`${order._id}-${item.name}-${index}`} className="muted">{item.name} · review page unavailable</span>; })}</div> : null}</article>) : <p className="muted">Your first order will appear here.</p>}</section><section className="account-card"><div className="account-card-head"><h2>Account</h2><UserRound /></div><p>{user.name}<br />{user.email}</p><div className="account-links"><Link className="text-link" to="/account/profile">Your details <ArrowRight size={16} /></Link><Link className="text-link" to="/account/addresses">Delivery addresses <ArrowRight size={16} /></Link><Link className="text-link" to="/wishlist">Your favourites <ArrowRight size={16} /></Link></div><button className="button button-outline logout-button" onClick={() => void request("/auth/logout", { method: "POST" }).then(() => { setUser(null); flash("You have signed out."); }).catch((e: Error) => flash(e.message))}>Sign out</button></section></div></main>;
  return <main className="page account-page auth-page"><div className="auth-panel"><div className="auth-intro"><span className="eyebrow">{adminSignIn ? "ROSHONA · STORE ADMIN" : "A PLACE AT OUR TABLE"}</span><h1>{adminSignIn ? <>Your store,<br /><em>your way.</em></> : mode === "login" ? <>Welcome <em>home.</em></> : <>Make yourself <em>at home.</em></>}</h1><p>{adminSignIn ? "Sign in with your administrator account to manage your store." : "Keep your orders and favourite spices close."}</p><img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=85" alt="Colourful spices and aromatics for a home kitchen" /><div className="auth-intro-note"><span>ROSHONA · THE ART OF SPICE</span><strong>Good things begin<br />around the table.</strong></div></div><form className="auth-form" onSubmit={(e) => void submit(e)}><div className="auth-form-topline"><span className="eyebrow">{adminSignIn ? "ADMINISTRATOR SIGN IN" : "YOUR ROSHONA ACCOUNT"}</span><Link to="/" className="auth-home-link">Back to store <ArrowRight size={14} /></Link></div>{!adminSignIn && <div className="auth-tabs" role="tablist" aria-label="Account access"><button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button><button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button></div>}<h2>{adminSignIn ? "Admin sign in." : mode === "login" ? "Good to see you." : "Let’s get acquainted."}</h2><p>{adminSignIn ? "Use the email and password assigned to your administrator account." : mode === "login" ? "Sign in to follow your orders and favourites." : "Create an account to keep your Roshona favourites close."}</p>{mode === "register" && <label>Your name<input name="name" autoComplete="name" required minLength={2} placeholder="Enter your name" /></label>}<label>Email address<input type="email" name="email" autoComplete="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 12} required placeholder={mode === "login" ? "Enter your password" : "Create a password"} /></label>{mode === "register" && <span className="password-hint">Use at least 12 characters for a strong password.</span>}{mode === "login" && <Link className="forgot-link" to="/forgot-password">Forgot your password?</Link>}<button className="button button-red auth-submit" disabled={busy}>{busy ? "One moment…" : adminSignIn ? "Sign in to admin" : mode === "login" ? "Sign in" : "Create your account"} <ArrowRight size={16} /></button><div className="auth-form-foot"><ShieldCheck size={15} /><span>{adminSignIn ? "Only approved administrator accounts can enter." : "Your account details are handled securely."}</span></div></form></div></main>;
}

function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { flash } = useStore();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const email = String(new FormData(event.currentTarget).get("email"));
    try {
      await apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setSubmitted(true);
    } catch (error) { flash(error instanceof Error ? error.message : "Could not request a password reset."); }
    finally { setBusy(false); }
  }
  return <main className="page account-page auth-page"><div className="auth-panel"><div className="auth-intro"><span className="eyebrow">A LITTLE HELP GETTING BACK</span><h1>Find your way<br /><em>back home.</em></h1><p>We can send a secure, time-limited reset link to your inbox.</p><img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=85" alt="Colourful spices and aromatics for a home kitchen" /><div className="auth-intro-note"><span>ROSHONA · THE ART OF SPICE</span><strong>Good things begin<br />around the table.</strong></div></div><div className="auth-form auth-recovery-form"><div className="auth-form-topline"><span className="eyebrow">{submitted ? "MESSAGE REQUESTED" : "ACCOUNT RECOVERY"}</span><Link to="/" className="auth-home-link">Back to store <ArrowRight size={14} /></Link></div><div className="auth-state-icon"><Mail size={21} /></div><h2>{submitted ? "Check your inbox." : "Forgot your password?"}</h2><p>{submitted ? "If an account exists for that address, reset instructions are on their way." : "Enter the email address linked to your account and we’ll send a secure reset link."}</p>{!submitted && <form onSubmit={(e) => void submit(e)}><label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label><button className="button button-red auth-submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"} <ArrowRight size={16} /></button></form>}<Link className="text-link auth-back" to="/account"><ArrowLeft size={15} /> Back to sign in</Link><div className="auth-form-foot"><ShieldCheck size={15} /><span>For your security, reset links expire after one hour.</span></div></div></div></main>;
}

function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const { flash } = useStore();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const password = String(new FormData(event.currentTarget).get("password"));
    try {
      await apiRequest("/auth/reset-password", { method: "POST", body: JSON.stringify({ token: params.get("token"), password }) });
      setComplete(true);
    } catch (error) { flash(error instanceof Error ? error.message : "Could not reset your password."); }
    finally { setBusy(false); }
  }
  return <main className="page account-page auth-page"><div className="auth-panel"><div className="auth-intro"><span className="eyebrow">{complete ? "PASSWORD UPDATED" : "A FRESH START"}</span><h1>{complete ? <>You’re all <em>set.</em></> : <>Choose a new<br /><em>password.</em></>}</h1><p>{complete ? "Your account is ready when you are." : "One quick step to get back to your account."}</p><img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=85" alt="Colourful spices and aromatics for a home kitchen" /><div className="auth-intro-note"><span>ROSHONA · THE ART OF SPICE</span><strong>Good things begin<br />around the table.</strong></div></div><div className="auth-form auth-recovery-form"><div className="auth-form-topline"><span className="eyebrow">{complete ? "YOU’RE READY" : "SECURE PASSWORD RESET"}</span><Link to="/" className="auth-home-link">Back to store <ArrowRight size={14} /></Link></div><div className="auth-state-icon"><ShieldCheck size={21} /></div><h2>{complete ? "Password updated." : "Set a new password."}</h2>{complete ? <><p>Your password has been updated. Sign in with your new password to continue.</p><Link className="button button-red auth-submit auth-reset-link" to="/account">Back to sign in <ArrowRight size={16} /></Link></> : <form onSubmit={(e) => void submit(e)}><p>Choose at least 12 characters. The secure link expires after one hour.</p><label>New password<input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required placeholder="Create a new password" /></label><button className="button button-red auth-submit" disabled={busy || !params.get("token")}>{busy ? "Updating…" : "Update password"} <ArrowRight size={16} /></button>{!params.get("token") && <p className="form-error">This reset link is missing its token. Request a new one.</p>}</form>}<Link className="text-link auth-back" to="/account"><ArrowLeft size={15} /> Back to sign in</Link><div className="auth-form-foot"><ShieldCheck size={15} /><span>Your password is protected and never displayed.</span></div></div></div></main>;
}

type Address = { label: string; recipient: string; phone: string; line1: string; city: string; postalCode: string };
function ProfilePage({ addressesOnly = false }: { addressesOnly?: boolean }) {
  const { user, request, flash } = useStore();
  const [profile, setProfile] = useState<{ name: string; phone: string }>({ name: user?.name ?? "", phone: "" });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void request<{ user: { name: string; phone?: string; addresses?: Address[] } }>("/auth/me")
      .then(({ user: data }) => { setProfile({ name: data.name, phone: data.phone ?? "" }); setAddresses(data.addresses ?? []); })
      .catch((error: Error) => flash(error.message));
  }, [request, flash]);
  if (!user) return <main className="page"><PageIntro kicker="YOUR ACCOUNT" title={<>A little more <em>personal.</em></>} subtitle="Sign in to manage your profile and delivery addresses." /><Link className="button button-red" to="/account">Sign in <ArrowRight size={16} /></Link></main>;
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      await request("/account/profile", { method: "PATCH", body: JSON.stringify(profile) });
      flash("Your profile has been updated.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not update your profile."); }
    finally { setBusy(false); }
  }
  async function saveAddresses(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const address: Address = {
      label: String(form.get("label")),
      recipient: String(form.get("recipient")),
      phone: String(form.get("phone")),
      line1: String(form.get("line1")),
      city: String(form.get("city")),
      postalCode: String(form.get("postalCode"))
    };
    try {
      const result = await request<{ user: { addresses: Address[] } }>("/account/addresses", {
        method: "PUT", body: JSON.stringify({ addresses: [...addresses, address] })
      });
      setAddresses(result.user.addresses);
      formElement.reset();
      flash("Your delivery address has been saved.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not save this address."); }
    finally { setBusy(false); }
  }
  async function removeAddress(index: number) {
    setBusy(true);
    try {
      const next = addresses.filter((_, itemIndex) => itemIndex !== index);
      const result = await request<{ user: { addresses: Address[] } }>("/account/addresses", { method: "PUT", body: JSON.stringify({ addresses: next }) });
      setAddresses(result.user.addresses);
      flash("Address removed.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not remove this address."); }
    finally { setBusy(false); }
  }
  return <main className="page"><PageIntro kicker={addressesOnly ? "YOUR DELIVERY DETAILS" : "YOUR ACCOUNT DETAILS"} title={addressesOnly ? <>A familiar way <em>home.</em></> : <>Your details, <em>your way.</em></>} subtitle="Your information is private to your account." /><div className="profile-layout">{!addressesOnly && <form className="profile-card" onSubmit={(e) => void saveProfile(e)}><h2>Your details</h2><label>Name<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required minLength={2} /></label><label>Email address<input value={user.email} readOnly /></label><label>Phone<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} maxLength={30} /></label><button className="button button-red" disabled={busy}>Save details <Check size={15} /></button></form>}<section className="profile-card"><h2>Delivery addresses</h2>{addresses.map((address, index) => <div className="saved-address" key={`${address.line1}-${index}`}><div><strong>{address.label || address.recipient}</strong><p>{address.recipient}<br />{address.line1}<br />{address.city} {address.postalCode}<br />{address.phone}</p></div><button className="remove-link" onClick={() => void removeAddress(index)} disabled={busy}>Remove</button></div>)}<form onSubmit={(e) => void saveAddresses(e)}><h3>Add an address</h3><div className="two-inputs"><label>Label<input name="label" placeholder="Home" /></label><label>Recipient name<input name="recipient" required minLength={2} /></label></div><div className="two-inputs"><label>Phone<input name="phone" type="tel" required minLength={6} /></label><label>Postal code<input name="postalCode" /></label></div><label>Address<input name="line1" required minLength={3} /></label><label>City<input name="city" required minLength={2} /></label><button className="button button-red" disabled={busy}>Save address <Plus size={15} /></button></form></section></div></main>;
}

function WishlistPage() {
  const { user, wishlist, recipeWishlist, products, request } = useStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState("");
  const loadSavedRecipes = useCallback(async () => {
    if (!user) return;
    setRecipesLoading(true); setRecipesError("");
    try { setRecipes((await request<{ recipes: Recipe[] }>("/account/recipe-wishlist")).recipes); }
    catch (e) { setRecipesError(e instanceof Error ? e.message : "Could not load saved recipes."); }
    finally { setRecipesLoading(false); }
  }, [request, user]);
  useEffect(() => { void loadSavedRecipes(); }, [loadSavedRecipes]);
  if (!user) return <main className="page"><PageIntro kicker="YOUR FAVOURITES" title={<>Spices to <em>come back to.</em></>} subtitle="Sign in to keep your favourite Roshona spices together." /><Link to="/account" className="button button-red">Sign in to see favourites <ArrowRight size={16} /></Link></main>;
  const savedRecipes = recipes.filter((recipe) => recipeWishlist.includes(recipe._id));
  return <main className="page"><PageIntro kicker="YOUR FAVOURITES" title={<>Things to <em>come back to.</em></>} subtitle="Your saved spices and recipes, gathered in one place." /><h2 className="wishlist-section-title">Favourite spices</h2><ProductGrid products={products.filter((product) => wishlist.includes(product._id))} /><section className="wishlist-recipes"><h2 className="wishlist-section-title">Saved recipes</h2>{recipesLoading && <p className="muted" role="status">Loading your saved recipes…</p>}{recipesError && <p className="form-error" role="alert">{recipesError} <button className="text-link" onClick={() => void loadSavedRecipes()}>Try again</button></p>}{!recipesLoading && !recipesError && (savedRecipes.length ? <div className="recipe-feature-grid">{savedRecipes.map((recipe) => <RecipeCard key={recipe._id} recipe={recipe} />)}</div> : <p className="muted">Your saved recipes will be gathered here.</p>)}</section></main>;
}

function StoryPage() {
  return <main className="story-page">
    <section className="story-hero">
      <div className="story-hero-inner">
        <div className="story-hero-copy">
          <span className="eyebrow">OUR STORY · ROOTED IN BANGLADESH</span>
          <h1>A little more <em>soul</em><br />in every spoonful.</h1>
          <p>Good food is one of the ways we remember where we come from—and make room for others. Roshona is an invitation to bring the warmth, colour and character of Bangladeshi cooking to your everyday table.</p>
          <div className="story-hero-actions">
            <Link to="/shop" className="button button-red">Explore our spices <ArrowRight size={16} /></Link>
            <Link to="/recipes" className="story-secondary-link">Find a little inspiration</Link>
          </div>
          <span className="story-hero-note"><span /> MADE FOR THE FLAVOURS OF HOME</span>
        </div>
        <div className="story-hero-art">
          <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=85" alt="A colourful assortment of spices ready for cooking" fetchPriority="high" />
          <div className="story-image-caption"><span>THE HEART OF THE KITCHEN</span><strong>Colour. Aroma. Memory.</strong></div>
          <span className="story-art-stamp" aria-hidden="true"><span>THE</span><strong>Art of<br />Spice</strong><span>ROSHONA</span></span>
        </div>
      </div>
    </section>

    <section className="story-belief">
      <div className="story-belief-inner">
        <span className="eyebrow">A TABLE WITH A STORY</span>
        <h2>Some of our favourite memories<br />begin <em>in the kitchen.</em></h2>
        <p>A pan warming on the stove. Someone tasting the curry and reaching for one more pinch. A familiar recipe, made a little differently in every home. Food has a way of bringing our stories together—and spices are part of how those stories unfold.</p>
      </div>
      <div className="story-belief-aside"><span className="story-asterisk" aria-hidden="true">✳</span><p>For the recipes we return to, and the ones we make our own.</p></div>
    </section>

    <section className="story-pantry">
      <div className="story-pantry-photo">
        <img src="https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=1100&q=85" alt="Warm spices and ingredients gathered for a home-cooked meal" loading="lazy" />
        <span>IN GOOD COMPANY · ROSHONA</span>
      </div>
      <div className="story-pantry-copy">
        <span className="eyebrow">A PANTRY THAT FEELS LIKE HOME</span>
        <h2>Familiar flavours.<br />Room to <em>make them yours.</em></h2>
        <p>We bring together the spices that sit at the heart of so many much-loved dishes. From the first pinch to the last taste, they are here for slow Sundays, quick suppers, celebrations and all the everyday meals in between.</p>
        <p>However you learned to cook, and whoever you are cooking for, there is always a place for you at the table.</p>
        <Link to="/recipes" className="text-link">Step into the Roshona kitchen <ArrowRight size={17} /></Link>
      </div>
    </section>

    <section className="story-values" aria-label="What inspires Roshona">
      <article><span>01</span><h3>Rooted in food culture</h3><p>Inspired by the colours, aromas and generous spirit of Bangladeshi cooking.</p></article>
      <article><span>02</span><h3>Made for real kitchens</h3><p>A collection for familiar recipes, new ideas and the little rituals of everyday cooking.</p></article>
      <article><span>03</span><h3>Best when shared</h3><p>Because a good meal is even better when there is room for one more.</p></article>
    </section>

    <section className="story-welcome">
      <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1800&q=85" alt="A meal set out to be shared around the table" loading="lazy" />
      <div className="story-welcome-overlay" />
      <div className="story-welcome-copy"><span className="eyebrow">PULL UP A CHAIR</span><h2>Welcome to<br /><em>our table.</em></h2><p>Let’s make something memorable.</p><Link to="/shop" className="button button-gold">Discover Roshona <ArrowRight size={16} /></Link></div>
    </section>
  </main>;
}

const faqs = [
  ["What spices can I find at Roshona?", "Our collection includes Garam Masala, Turmeric Powder, Coriander Powder, Red Chilli Powder and Cumin Powder."],
  ["What are your prices?", "Garam Masala is ৳149 per 100g and Turmeric Powder is ৳100 per 100g. Prices for the other spices are not confirmed yet."],
  ["How can I place an order?", "Add products with confirmed prices to your bag and use our cash-on-delivery checkout."],
  ["Which payment methods do you accept?", "Cash on delivery is currently available. Online payment is not yet connected."],
  ["How long does delivery take?", "Delivery coverage, rates and timings have not yet been confirmed. Please contact us for current information."],
  ["How can I track an order?", "Once you have an order number, enter it on our tracking page to check its latest status."],
  ["Can I return or cancel my order?", "Our return and cancellation policy has not yet been confirmed. Please contact us before placing an order if you need help."],
  ["How do I get in touch?", "Send us a message from the contact page and the Roshona team will be happy to hear from you."]
];
function FAQPage() {
  const [query, setQuery] = useState("");
  const matchingFaqs = faqs.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <main className="page faq-page"><div className="faq-layout">
    <aside className="faq-visual" aria-label="Roshona spices">
      <div className="faq-visual-orbit faq-visual-orbit-one" />
      <div className="faq-visual-orbit faq-visual-orbit-two" />
      <div className="faq-animation" aria-hidden="true">
        <span className="faq-question-mark">?</span>
        <span className="faq-question-mark faq-question-mark-small">?</span>
        <span className="faq-spark faq-spark-one">✦</span>
        <span className="faq-spark faq-spark-two">✧</span>
        <div className="faq-person">
          <span className="faq-person-hair" />
          <span className="faq-person-face"><i /><i /><b /></span>
          <span className="faq-person-neck" />
          <span className="faq-person-body" />
          <span className="faq-person-arm faq-person-arm-left" />
          <span className="faq-person-arm faq-person-arm-right" />
          <span className="faq-person-leg faq-person-leg-left" />
          <span className="faq-person-leg faq-person-leg-right" />
          <span className="faq-person-shoe faq-person-shoe-left" />
          <span className="faq-person-shoe faq-person-shoe-right" />
        </div>
        <span className="faq-word faq-word-faq">FAQ</span>
        <span className="faq-animation-ground" />
        <span className="faq-thought-card">How can we help?</span>
      </div>
      <div className="faq-visual-caption"><span>ROSHONA · THE ART OF SPICE</span><span>HERE FOR YOUR TABLE</span></div>
    </aside>
    <section className="faq-content">
      <span className="eyebrow">A FEW THINGS YOU MIGHT WONDER</span>
      <h1>Have questions?<br />Get your <em>answer.</em></h1>
      <p className="faq-intro">A little clarity makes every order feel easier. Search for what you need or browse the questions below.</p>
      <label className="faq-search"><Search size={18} /><input type="search" aria-label="Search frequently asked questions" placeholder="Type your question here" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={16} /></button>}</label>
      <div className="faq-list" aria-live="polite">{matchingFaqs.map(([question, answer], i) => <details key={question} className="faq-item" open={i === 0 && query.length > 0}><summary><span>{question}</span><span className="faq-toggle" aria-hidden="true"><Plus size={17} /><Minus size={17} /></span></summary><p>{answer}</p></details>)}{!matchingFaqs.length && <p className="faq-no-results">No answers match that search. Try another phrase, or <Link to="/contact">send us a note</Link>.</p>}</div>
      <div className="faq-contact"><span>Still have a question?</span><Link to="/contact" className="text-link">Talk to our team <ArrowRight size={15} /></Link></div>
    </section>
  </div></main>;
}
function ContactPage() {
  const { flash } = useStore();
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = event.currentTarget;
    try {
      const data = new FormData(form);
      await apiRequest("/contact", { method: "POST", body: JSON.stringify({ name: data.get("name"), email: data.get("email"), subject: data.get("subject"), message: data.get("message") }) });
      form.reset();
      flash("Thanks for your note. We will be in touch.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not send your message."); }
    finally { setBusy(false); }
  }
  return <main className="contact-page">
   <section className="contact-hero">
     <div className="contact-hero-inner">
       <div className="contact-hero-copy">
         <span className="eyebrow">A NOTE, A QUESTION, A LITTLE HELLO</span>
         <h1>We’d love to<br />hear <em>from you.</em></h1>
         <p>Whether you’re choosing a spice, checking on an order, or simply want to tell us what’s cooking, our door is open. Leave us a note and we’ll be glad to hear from you.</p>
         <a className="contact-email-link" href="#contact-form"><Mail size={16} /> Write to the Roshona team <ArrowRight size={15} /></a>
       </div>
       <div className="contact-hero-image">
         <img src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=85" alt="A warm home kitchen ready for cooking" fetchPriority="high" />
         <div className="contact-image-label"><span>FROM OUR KITCHEN TO YOURS</span><strong>There’s always room<br />for a conversation.</strong></div>
       </div>
     </div>
   </section>

   <section className="contact-main" aria-label="Contact Roshona">
     <aside className="contact-sidebar">
       <span className="eyebrow">HERE TO HELP</span>
       <h2>Whatever’s on<br />your <em>mind.</em></h2>
       <p>Choose a topic in the form and tell us a little more. We’ll make sure your message reaches the right place.</p>
       <div className="contact-topic-list">
         <div><span><ShoppingBag size={17} /></span><p><strong>An order</strong><small>Questions about an order you’ve placed.</small></p></div>
         <div><span><Leaf size={17} /></span><p><strong>Our spices</strong><small>Want to know more about the pantry collection?</small></p></div>
         <div><span><MessageSquareText size={17} /></span><p><strong>Something else</strong><small>We’re happy to hear what you have in mind.</small></p></div>
       </div>
       <div className="contact-help-links"><Link to="/track-order">Looking for an order update? <ArrowRight size={14} /></Link></div>
     </aside>

     <form id="contact-form" className="contact-form contact-form-redesign" onSubmit={(e) => void submit(e)}>
       <div className="contact-form-heading"><span className="eyebrow">SEND US A MESSAGE</span><h2>Let’s get the conversation started.</h2><p>Fill in the details below and share whatever would be helpful.</p></div>
       <div className="two-inputs">
         <label htmlFor="contact-name">Your name<input id="contact-name" autoComplete="name" required name="name" minLength={2} placeholder="How should we address you?" /></label>
         <label htmlFor="contact-email">Email address<input id="contact-email" autoComplete="email" required type="email" name="email" placeholder="you@example.com" /></label>
       </div>
       <label htmlFor="contact-subject">What can we help with?<select id="contact-subject" name="subject" defaultValue="A question about spices"><option>A question about spices</option><option>An existing order</option><option>Something else</option></select></label>
       <label htmlFor="contact-message">Your message<textarea id="contact-message" name="message" required minLength={10} rows={6} placeholder="Tell us a little more…" /></label>
       <div className="contact-submit-row"><button className="button button-red" disabled={busy}>{busy ? "Sending your note…" : "Send your message"} <ArrowRight size={16} /></button><span><ShieldCheck size={15} /> Your details help us respond to your enquiry.</span></div>
     </form>
   </section>
   <section className="contact-signoff"><span aria-hidden="true">✳</span><p>Good food brings us together.<br /><em>Good conversations do, too.</em></p><Link to="/our-story" className="text-link">A little more about Roshona <ArrowRight size={16} /></Link></section>
  </main>;
}

function OrderTrackPage() {
  const { request } = useStore();
  const [params] = useSearchParams();
  const [result, setResult] = useState<{ orderNumber: string; status: string; createdAt: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setResult(null);
    const number = String(new FormData(event.currentTarget).get("number")).trim();
    try { const data = await request<{ order: typeof result }>(`/orders/track/${encodeURIComponent(number)}`); setResult(data.order); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not find that order."); }
    finally { setBusy(false); }
  }
  return <main className="page"><PageIntro kicker="A LITTLE UPDATE" title={<>Your order, <em>wherever it is.</em></>} subtitle="Enter the order number from your confirmation to check its latest status." /><form className="track-form" onSubmit={(e) => void submit(e)}><label>Order number<input name="number" placeholder="RSH-…" defaultValue={params.get("order") ?? ""} required /></label><button className="button button-red" disabled={busy}>{busy ? "Looking…" : "Find my order"} <ArrowRight size={16} /></button></form>{error && <p className="form-error">{error}</p>}{result && <section className="track-result"><span className="eyebrow">ORDER {result.orderNumber}</span><h2>Your order is <em>{result.status}.</em></h2><p>Placed {new Date(result.createdAt).toLocaleDateString()}.</p></section>}</main>;
}

function RecipesPage() {
  const { request } = useStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadRecipes = useCallback(async () => {
    setLoading(true); setError("");
    try { setRecipes((await request<{ recipes: Recipe[] }>("/recipes")).recipes); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load recipes."); }
    finally { setLoading(false); }
  }, [request]);
  useEffect(() => { void loadRecipes(); }, [loadRecipes]);
  return <main className="page recipes-page"><PageIntro kicker="FROM THE ROSHONA KITCHEN" title={<>A little inspiration for <em>your table.</em></>} subtitle="Cook something memorable with these recipes and the spices you love." />
    {loading && <div className="section-feedback" role="status"><span className="spinner" /> Bringing the recipes to the table…</div>}
    {error && <div className="section-feedback section-feedback-error" role="alert">{error}<button className="text-link" onClick={() => void loadRecipes()}>Try again <ArrowRight size={15} /></button></div>}
    {!loading && !error && recipes.length > 0 && <div className="recipe-feature-grid recipe-page-grid">{recipes.map((recipe) => <RecipeCard key={recipe._id} recipe={recipe} featured />)}</div>}
    {!loading && !error && !recipes.length && <div className="empty-cart"><Sparkles size={32} /><p>Our recipe journal is being prepared.</p><Link to="/shop" className="button button-red">Explore the spices <ArrowRight size={16} /></Link></div>}
  </main>;
}

function RecipeDetailPage() {
  const { slug } = useParams();
  const { request } = useStore();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true); setError("");
    void request<{ recipe: Recipe }>(`/recipes/${encodeURIComponent(slug)}`)
      .then(({ recipe: result }) => { if (!cancelled) setRecipe(result); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load this recipe."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [request, slug]);
  if (loading) return <main className="page"><div className="section-feedback" role="status"><span className="spinner" /> Bringing the recipe to the table…</div></main>;
  if (error) return <main className="page"><PageIntro kicker="FROM THE ROSHONA KITCHEN" title={<>A recipe gone <em>wandering.</em></>} subtitle={error} /><Link className="button button-red" to="/recipes">Back to all recipes <ArrowLeft size={16} /></Link></main>;
  if (!recipe) return <NotFoundPage />;
  return <main className="page recipe-detail-page"><Link to="/recipes" className="back-link"><ArrowLeft size={16} /> All recipes</Link><div className="recipe-detail-hero"><img src={recipe.image} alt={recipe.imageAlt} /><div><span className="eyebrow">FROM THE ROSHONA KITCHEN</span><h1>{recipe.title}<em>.</em></h1><p>{recipe.description}</p><span className="recipe-detail-time"><Clock3 size={16} /> About {recipe.prepMinutes} minutes</span></div></div><div className="recipe-method-grid"><section className="recipe-ingredients"><span className="eyebrow">GATHER YOUR INGREDIENTS</span><h2>What you'll need</h2><ul>{recipe.ingredients.map((item, i) => <li key={`${item.name}-${i}`}><span>{item.name}</span><strong>{item.quantity}</strong></li>)}</ul></section><section className="recipe-instructions"><span className="eyebrow">A LITTLE TIME IN THE KITCHEN</span><h2>Let's make it</h2><ol>{recipe.instructions.map((step, i) => <li key={step}><span>{String(i + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol></section></div></main>;
}

function PolicyPage({ kind }: { kind: "shipping" | "returns" | "privacy" | "terms" }) {
  const info = {
    shipping: { label: "DELIVERY, WITHOUT THE GUESSWORK", title: <>A little note on <em>delivery.</em></>, heading: "We'll share details soon.", body: "Delivery areas, charges and estimated delivery times are not yet confirmed. We do not want to promise a date or rate before it is set. Please contact us before placing an order if you would like the latest delivery information." },
    returns: { label: "A NOTE ON RETURNS", title: <>If something isn't <em>quite right.</em></>, heading: "We're here to help.", body: "A returns, refunds and cancellation policy has not yet been confirmed. If you have a concern about an order, please contact us so we can assist." },
    privacy: { label: "YOUR INFORMATION MATTERS", title: <>A little care for <em>your details.</em></>, heading: "A brief privacy note.", body: "A full privacy policy has not yet been confirmed. Please contact us if you have questions about how account or order information is handled." },
    terms: { label: "A NOTE BEFORE YOU SHOP", title: <>The details matter. <em>Always.</em></>, heading: "Our terms are being prepared.", body: "Store terms have not yet been confirmed. Please contact us with any questions before placing an order." }
  }[kind];
  return <main className="page"><PageIntro kicker={info.label} title={info.title} subtitle="Clear information, and no guesswork." /><article className="policy-content"><span className="policy-numeral">01</span><div><h2>{info.heading}</h2><p>{info.body}</p><Link to="/contact" className="text-link">Get in touch <ArrowRight size={15} /></Link></div></article></main>;
}
function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  return <main className="page confirmation-page"><span className="confirmation-icon"><Check size={32} /></span><span className="eyebrow">AN ORDER FOR THE TABLE</span><h1>Thank you, <em>truly.</em></h1><p>Your cash-on-delivery order is in. Hold on to your order number for updates.</p><div className="confirmation-number">{orderNumber}</div><div className="confirmation-actions"><Link to={`/track-order?order=${encodeURIComponent(orderNumber ?? "")}`} className="button button-red">Follow your order <ArrowRight size={16} /></Link><Link to="/shop" className="text-link">A little more browsing <ArrowRight size={15} /></Link></div></main>;
}
function NotFoundPage() {
  return <main className="not-found"><img src={images.collection} alt="" /><div className="not-found-copy"><span className="eyebrow">WE COULDN'T FIND THAT PAGE</span><h1>Well, this is a<br /><em>little unexpected.</em></h1><p>That page seems to have gone wandering. Let's get you back to the good stuff.</p><Link to="/" className="button button-red">Back to the beginning <ArrowRight size={16} /></Link></div><div className="error-number">404</div></main>;
}

const adminTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products & stock", icon: Boxes },
  { id: "categories", label: "Categories", icon: Sparkles },
  { id: "recipes", label: "Recipes", icon: Clock3 },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "customers", label: "Customers", icon: UsersRound },
  { id: "messages", label: "Messages", icon: MessageSquareText },
  { id: "content", label: "Store settings", icon: Settings }
] as const;
type AdminTab = typeof adminTabs[number]["id"];
type AdminOrder = { _id: string; orderNumber: string; customer: { name: string; email: string; phone: string; address: string; city: string }; items: Array<{ name: string; quantity: number }>; subtotal?: number; shipping?: number; tax?: number; taxRate?: number; total: number; status: string; createdAt: string };
type AdminSummary = { products: number; customers: number; orders: number; revenue: number; recentOrders: AdminOrder[] };
type AdminReview = Review & { status: "pending" | "approved" | "rejected"; user: { name: string; email: string } | null; product: { name: string; slug: string } | null };
type AdminMessage = { _id: string; name: string; email: string; subject: string; message: string; status: "new" | "read" | "resolved"; createdAt: string };

function AdminPage() {
  const { user, request, flash, refreshProducts, setUser } = useStore();
  const navigate = useNavigate();
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<AdminTab>("overview");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [customers, setCustomers] = useState<Array<{ _id: string; name: string; email: string; phone?: string }>>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; slug: string }>>([]);
  const [settings, setSettings] = useState<Array<{ _id: string; key: string; value: Record<string, unknown> }>>([]);
  const [checkoutForm, setCheckoutForm] = useState({ deliveryFee: "", freeMinimum: "", vatEnabled: false, vatRate: "" });
  const [savingCheckout, setSavingCheckout] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productImage, setProductImage] = useState("");
  const [productImageFailed, setProductImageFailed] = useState(false);
  const [productFormError, setProductFormError] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [recipeFormOpen, setRecipeFormOpen] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [editCategory, setEditCategory] = useState<{ _id: string; name: string; slug: string } | null>(null);

  async function loadData(currentTab: AdminTab) {
    if (currentTab === "overview") {
      const result = await request<{ summary: AdminSummary }>("/admin/summary");
      setSummary(result.summary);
    } else if (currentTab === "products") {
      const result = await request<{ products: Product[] }>("/admin/products");
      setProducts(result.products);
    } else if (currentTab === "orders") {
      const result = await request<{ orders: AdminOrder[] }>("/admin/orders");
      setOrders(result.orders);
    } else if (currentTab === "customers") {
      const result = await request<{ customers: typeof customers }>("/admin/customers");
      setCustomers(result.customers);
    } else if (currentTab === "categories") {
      const result = await request<{ categories: typeof categories }>("/admin/categories");
      setCategories(result.categories);
    } else if (currentTab === "recipes") {
      const result = await request<{ recipes: Recipe[] }>("/admin/recipes");
      setRecipes(result.recipes);
    } else if (currentTab === "reviews") {
      const result = await request<{ reviews: AdminReview[] }>("/admin/reviews");
      setReviews(result.reviews);
    } else if (currentTab === "messages") {
      const result = await request<{ messages: AdminMessage[] }>("/admin/messages");
      setMessages(result.messages);
    } else {
      const result = await request<{ settings: typeof settings }>("/admin/settings");
      setSettings(result.settings);
      const stored = result.settings.find((setting) => setting.key === "checkout")?.value;
      if (stored && typeof stored.delivery === "object" && stored.delivery !== null && typeof stored.vat === "object" && stored.vat !== null) {
        const delivery = stored.delivery as Record<string, unknown>;
        const vat = stored.vat as Record<string, unknown>;
        setCheckoutForm({
          deliveryFee: typeof delivery.baseFee === "number" ? String(delivery.baseFee) : "",
          freeMinimum: typeof delivery.freeDeliveryMinimumSubtotal === "number" ? String(delivery.freeDeliveryMinimumSubtotal) : "",
          vatEnabled: vat.enabled === true,
          vatRate: typeof vat.ratePercent === "number" ? String(vat.ratePercent) : ""
        });
      } else {
        setCheckoutForm({ deliveryFee: "", freeMinimum: "", vatEnabled: false, vatRate: "" });
      }
    }
  }
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    let cancelled = false;
    setBusy(true);
    void loadData(tab)
      .catch((error: Error) => { if (!cancelled) flash(error.message); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [user, tab, flash]);

  if (!user || user.role !== "admin") return <main className="page admin-login-page"><div className="admin-login-intro"><PageIntro kicker="ROSHONA · THE BACK OFFICE" title={<>A thoughtful shop,<br /><em>behind the scenes.</em></>} subtitle="Sign in with your administrator account to manage the store." /></div><form className="admin-login-card" onSubmit={(event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoginBusy(true);
    setLoginError("");
    void request<{ user: NonNullable<typeof user> }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: String(form.get("email")), password: String(form.get("password")) })
    }).then(async ({ user: signedInUser }) => {
      if (signedInUser.role !== "admin") {
        await request("/auth/logout", { method: "POST" });
        setUser(null);
        setLoginError("This account does not have administrator access. Sign in using an administrator account.");
        return;
      }
      setUser(signedInUser);
      flash(`Welcome, ${signedInUser.name.split(" ")[0]}.`);
    }).catch((error: unknown) => {
      setLoginError(error instanceof Error ? error.message : "Could not sign in to the admin dashboard.");
    }).finally(() => setLoginBusy(false));
  }}><span className="eyebrow">ADMINISTRATOR SIGN IN</span><h2>{user ? "Switch to an admin account." : "Sign in to your store."}</h2><p>{user ? `Currently signed in as ${user.email}. Enter administrator credentials to switch accounts.` : "Use the email and password configured for your administrator account."}</p>{loginError && <p className="admin-login-error" role="alert">{loginError}</p>}<label>Email address<input name="email" type="email" autoComplete="username" required placeholder="admin@example.com" /></label><label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Administrator password" /></label><button className="button button-red admin-login-submit" disabled={loginBusy}>{loginBusy ? "Signing in…" : "Sign in to admin"} <ArrowRight size={16} /></button><div className="admin-login-actions">{user && <button className="text-link admin-signout-link" type="button" onClick={() => void request("/auth/logout", { method: "POST" }).then(() => { setUser(null); setLoginError(""); }).catch((error: Error) => setLoginError(error.message))}>Sign out of customer account</button>}<Link className="text-link" to="/forgot-password">Forgot password?</Link><Link className="text-link" to="/">Back to the store <ArrowRight size={15} /></Link></div></form></main>;

  async function refresh() {
    setBusy(true);
    try { await loadData(tab); } catch (error) { flash(error instanceof Error ? error.message : "Could not load the dashboard."); }
    finally { setBusy(false); }
  }
  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawPrice = String(form.get("price") ?? "").trim();
    const rawStock = String(form.get("stock") ?? "0").trim();
    const payload = {
      name: String(form.get("name")).trim(),
      slug: String(form.get("slug")).trim(),
      category: String(form.get("category")).trim(),
      description: String(form.get("description")).trim(),
      image: normalizeProductImage(productImage),
      weight: String(form.get("weight")).trim() || "100g",
      price: rawPrice ? Number(rawPrice) : null,
      stock: Number(rawStock),
      featured: form.get("featured") === "on",
      active: form.get("active") === "on"
    };
    setProductFormError("");
    if (products.some((product) => product.slug === payload.slug && product._id !== editProduct?._id)) {
      const suggestedSlug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setProductFormError(`A product already uses “${payload.slug}”. Choose a unique URL slug${suggestedSlug && suggestedSlug !== payload.slug ? `, such as “${suggestedSlug}”` : ""}.`);
      return;
    }
    if (payload.image && !payload.image.startsWith("/") && !/^https?:\/\//i.test(payload.image)) {
      setProductFormError("Use an image URL beginning with https:// or a site path such as /assets/product-photo.png.");
      return;
    }
    setSavingProduct(true);
    try {
      await request(editProduct ? `/admin/products/${editProduct._id}` : "/admin/products", {
        method: editProduct ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      setFormOpen(false); setEditProduct(null);
      await refresh(); await refreshProducts();
      flash(editProduct ? "Product updated on the storefront." : "Product added to the storefront.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this product.";
      setProductFormError(message);
      flash(message);
    } finally {
      setSavingProduct(false);
    }
  }
  async function updateOrderStatus(orderId: string, status: string) {
    try {
      await request(`/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refresh();
      flash("Order status updated.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not update this order."); }
  }
  async function updateReviewStatus(reviewId: string, status: "approved" | "rejected") {
    try {
      await request(`/admin/reviews/${reviewId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refresh();
      flash(status === "approved" ? "Review approved and published." : "Review rejected.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not update this review."); }
  }
  async function saveRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    let ingredients: Array<{ quantity: string; name: string }>;
    try {
      ingredients = String(form.get("ingredients")).split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
        const separator = line.indexOf("|");
        if (separator < 1 || !line.slice(separator + 1).trim()) throw new Error("Write each ingredient as quantity | ingredient.");
        return { quantity: line.slice(0, separator).trim(), name: line.slice(separator + 1).trim() };
      });
    } catch (e) { flash(e instanceof Error ? e.message : "Check the ingredient list."); return; }
    const instructions = String(form.get("instructions")).split("\n").map((line) => line.trim()).filter(Boolean);
    if (!ingredients.length || !instructions.length) { flash("Add at least one ingredient and one method step."); return; }
    const payload = {
      title: String(form.get("title")).trim(),
      slug: String(form.get("slug")).trim(),
      description: String(form.get("description")).trim(),
      image: String(form.get("image")).trim(),
      imageAlt: String(form.get("imageAlt")).trim(),
      prepMinutes: Number(form.get("prepMinutes")),
      ingredients,
      instructions,
      active: form.get("active") === "on"
    };
    try {
      await request(editRecipe ? `/admin/recipes/${editRecipe._id}` : "/admin/recipes", {
        method: editRecipe ? "PATCH" : "POST", body: JSON.stringify(payload)
      });
      setRecipeFormOpen(false); setEditRecipe(null); await refresh();
      flash(editRecipe ? "Recipe updated on the storefront." : "Recipe published to the storefront.");
    } catch (e) { flash(e instanceof Error ? e.message : "Could not save this recipe."); }
  }
  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name")).trim();
    const slug = String(form.get("slug")).trim();
    try {
      await request(editCategory ? `/admin/categories/${editCategory._id}` : "/admin/categories", {
        method: editCategory ? "PATCH" : "POST",
        body: JSON.stringify({ name, slug })
      });
      setEditCategory(null);
      await refresh(); await refreshProducts();
      flash(editCategory ? "Category updated." : "Category added.");
      formElement.reset();
    } catch (error) { flash(error instanceof Error ? error.message : "Could not add category."); }
  }
  async function removeCategory(category: { _id: string; name: string }) {
    if (!window.confirm(`Remove “${category.name}”? Categories with products assigned cannot be removed.`)) return;
    try {
      await request(`/admin/categories/${category._id}`, { method: "DELETE" });
      await refresh();
      flash("Category removed.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not remove this category."); }
  }
  async function setProductVisibility(product: Product) {
    try {
      await request(`/admin/products/${product._id}`, { method: "PATCH", body: JSON.stringify({ active: !product.active }) });
      await refresh(); await refreshProducts();
      flash(product.active ? "Product hidden from the storefront." : "Product published to the storefront.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not update product visibility."); }
  }
  async function setRecipeVisibility(recipe: Recipe) {
    try {
      await request(`/admin/recipes/${recipe._id}`, { method: "PATCH", body: JSON.stringify({ active: !recipe.active }) });
      await refresh();
      flash(recipe.active ? "Recipe hidden from the storefront." : "Recipe published to the storefront.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not update recipe visibility."); }
  }
  async function updateMessageStatus(messageId: string, status: AdminMessage["status"]) {
    try {
      await request(`/admin/messages/${messageId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refresh();
      flash("Message status updated.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not update this message."); }
  }
  async function saveSetting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const key = String(form.get("key")).trim();
    const raw = String(form.get("value"));
    let value: Record<string, unknown>;
    try {
      value = JSON.parse(raw) as Record<string, unknown>;
      if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("Enter a JSON object.");
      await request(`/admin/settings/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ value }) });
      await refresh();
      flash("Store setting saved.");
    } catch (error) { flash(error instanceof Error ? error.message : "Enter a valid JSON object."); }
  }
  async function saveCheckoutSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const deliveryFee = Number(checkoutForm.deliveryFee);
    const freeMinimum = checkoutForm.freeMinimum.trim() === "" ? null : Number(checkoutForm.freeMinimum);
    const vatRate = checkoutForm.vatRate.trim() === "" ? 0 : Number(checkoutForm.vatRate);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0 || (freeMinimum !== null && (!Number.isFinite(freeMinimum) || freeMinimum < 0))) {
      flash("Enter valid non-negative delivery amounts.");
      return;
    }
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100 || (checkoutForm.vatEnabled && vatRate === 0)) {
      flash("Enter a VAT rate greater than 0 and no more than 100 before enabling VAT.");
      return;
    }
    setSavingCheckout(true);
    try {
      await request("/admin/settings/checkout", {
        method: "PUT",
        body: JSON.stringify({
          value: {
            delivery: { baseFee: deliveryFee, freeDeliveryMinimumSubtotal: freeMinimum },
            vat: { enabled: checkoutForm.vatEnabled, ratePercent: vatRate }
          }
        })
      });
      await loadData("content");
      flash("Checkout and VAT settings saved.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not save checkout settings.");
    } finally {
      setSavingCheckout(false);
    }
  }

  return <main className="admin-shell">
    <aside className="admin-sidebar"><Link to="/" className="admin-logo"><img src={images.logo} alt="Roshona" /><span>STORE ADMIN</span></Link><span className="admin-side-label">YOUR STORE</span>{adminTabs.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setTab(item.id)} className={`admin-nav-item ${tab === item.id ? "active" : ""}`}><Icon size={18} />{item.label}</button>; })}<div className="admin-sidebar-bottom"><span className="admin-avatar">{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><span>Administrator</span></div><button className="icon-button" aria-label="Sign out" onClick={() => void request("/auth/logout", { method: "POST" }).then(() => { setUser(null); navigate("/account"); }).catch((e: Error) => flash(e.message))}><ArrowLeft size={16} /></button></div></aside>
    <section className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">ROSHONA · STORE ADMIN</span><h1>{adminTabs.find((item) => item.id === tab)?.label}</h1></div><div className="admin-top-right">{(tab === "categories" || tab === "messages") && <label className="admin-search"><Search size={15} /><input aria-label={`Search ${tab}`} placeholder={`Search ${tab}…`} value={search} onChange={(event) => setSearch(event.target.value)} /></label>}<button className="admin-refresh" onClick={() => void refresh()} disabled={busy}><RefreshCw size={14} className={busy ? "is-spinning" : ""} /> Refresh</button><span className="admin-live-dot" /> Live store data <Link to="/" className="text-link">View shop <ArrowRight size={15} /></Link></div></header>
      <div className="admin-content">
        {tab === "overview" && <>{summary && <><div className="admin-welcome"><span className="eyebrow light-eyebrow">YOUR SHOP, AT A GLANCE</span><h2>A good day to make<br /><em>something lovely.</em></h2><p>Here is what is happening in your Roshona store.</p><BarChart3 className="welcome-watermark" size={110} /></div><div className="stat-grid"><div className="stat-card"><span>ORDERS</span><strong>{summary.orders}</strong><small>All recorded orders</small><ClipboardList /></div><div className="stat-card"><span>GROSS SALES</span><strong>{taka(summary.revenue)}</strong><small>Excluding cancelled orders</small><BarChart3 /></div><div className="stat-card"><span>SHOPPERS</span><strong>{summary.customers}</strong><small>Registered customer accounts</small><UsersRound /></div><div className="stat-card"><span>PRODUCTS</span><strong>{summary.products}</strong><small>Across your spice collection</small><Boxes /></div></div><AdminOrders orders={summary.recentOrders} onUpdate={updateOrderStatus} /></>}</>}
        {tab === "products" && <section className="admin-card"><div className="admin-card-heading"><div><span className="eyebrow">YOUR COLLECTION</span><h2>Spices & stock</h2></div><button className="button button-red" onClick={() => { setEditProduct(null); setProductImage(""); setProductImageFailed(false); setProductFormError(""); setFormOpen(!formOpen); }}>＋ Add a spice</button></div>{formOpen && <form className="admin-product-form" onSubmit={(e) => void saveProduct(e)}><h3>{editProduct ? "Edit spice" : "Add a spice to the collection"}</h3>{productFormError && <p className="admin-product-error" role="alert">{productFormError}</p>}<div className="admin-form-grid"><label>Product name<input name="name" required defaultValue={editProduct?.name} /></label><label>URL slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={editProduct?.slug} placeholder="turmeric-powder" /></label><label>Category<input name="category" required defaultValue={editProduct?.category} /></label><label>Price (BDT)<input name="price" type="number" min="0" step="0.01" defaultValue={editProduct?.price ?? ""} placeholder="Leave blank until confirmed" /></label><label>Stock quantity<input name="stock" type="number" min="0" step="1" defaultValue={editProduct?.stock ?? 0} /></label><label>Pack weight<input name="weight" defaultValue={editProduct?.weight ?? "100g"} /></label>        <div className="form-wide"><label>Image URL or site path<input name="image" value={productImage} onChange={(event) => { setProductImage(event.target.value); setProductImageFailed(false); }} onBlur={() => setProductImage(normalizeProductImage(productImage))} placeholder="/assets/product-photo.png" /></label><p className="admin-image-help">Use an image URL or a path under <code>frontend/public</code>, such as <code>/assets/product-photo.png</code>. You can also paste <code>frontend\\public\\assets\\photo.png</code>; it will be converted to a site path. A file path outside <code>frontend/public</code> is not available to the website.</p>{productImage && !productImageFailed ? <img className="admin-image-preview" src={normalizeProductImage(productImage)} alt="Product image preview" onError={() => setProductImageFailed(true)} /> : productImage ? <p className="admin-image-invalid" role="status">Image could not be loaded. Check the URL/path and ensure the file exists in <code>frontend/public</code>.</p> : <p className="admin-image-empty">Image preview appears here.</p>}</div><label className="form-wide">Description<textarea name="description" rows={3} defaultValue={editProduct?.description} /></label><label className="check-label"><input type="checkbox" name="featured" defaultChecked={editProduct?.featured} /> Feature on homepage</label><label className="check-label"><input type="checkbox" name="active" defaultChecked={editProduct?.active ?? true} /> Show on storefront</label></div><div className="admin-form-actions"><button className="button button-red" disabled={savingProduct}>{savingProduct ? "Saving…" : "Save product"}</button><button className="button button-outline" type="button" disabled={savingProduct} onClick={() => { setFormOpen(false); setEditProduct(null); setProductImage(""); setProductFormError(""); }}>Cancel</button></div></form>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>SPICE</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><div className="admin-product-name"><img src={product.image} alt="" /><strong>{product.name}<small>{product.slug}</small></strong></div></td><td>{product.category}</td><td>{product.price != null ? taka(product.price) : "Not confirmed"}</td><td>{product.stock}</td><td><span className={`status-pill ${product.active ? "status-on" : "status-off"}`}>{product.active ? "Available" : "Hidden"}</span></td><td><button className="admin-edit" onClick={() => { setEditProduct(product); setProductImage(product.image); setProductImageFailed(false); setProductFormError(""); setFormOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button><button className="admin-edit" onClick={() => void setProductVisibility(product)}>{product.active ? "Hide" : "Publish"}</button></td></tr>)}</tbody></table>{!products.length && <p className="admin-empty">No products yet. Add the first spice above.</p>}</div></section>}
        {tab === "orders" && <AdminOrders orders={orders} onUpdate={updateOrderStatus} />}
        {tab === "recipes" && <section className="admin-card"><div className="admin-card-heading"><div><span className="eyebrow">FROM THE ROSHONA KITCHEN</span><h2>Recipe journal</h2></div><button className="button button-red" onClick={() => { setEditRecipe(null); setRecipeFormOpen(!recipeFormOpen); }}>＋ Add a recipe</button></div>{recipeFormOpen && <form className="admin-product-form" onSubmit={(e) => void saveRecipe(e)}><h3>{editRecipe ? "Edit recipe" : "Add a recipe"}</h3><div className="admin-form-grid"><label>Recipe title<input name="title" required minLength={3} defaultValue={editRecipe?.title} /></label><label>URL slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={editRecipe?.slug} placeholder="spiced-fish-curry" /></label><label>Preparation time (minutes)<input name="prepMinutes" required type="number" min="1" max="1440" defaultValue={editRecipe?.prepMinutes ?? 30} /></label><label>Image path<input name="image" required defaultValue={editRecipe?.image} placeholder="/assets/recipe-photo.jpg" /></label><label className="form-wide">Image description<input name="imageAlt" required minLength={5} defaultValue={editRecipe?.imageAlt} /></label><label className="form-wide">Short description<textarea name="description" required minLength={10} rows={2} defaultValue={editRecipe?.description} /></label><label className="form-wide">Ingredients, one per line (quantity | ingredient)<textarea name="ingredients" required rows={6} defaultValue={editRecipe?.ingredients.map((item) => `${item.quantity} | ${item.name}`).join("\n")} /></label><label className="form-wide">Method, one step per line<textarea name="instructions" required rows={7} defaultValue={editRecipe?.instructions.join("\n")} /></label><label className="check-label"><input type="checkbox" name="active" defaultChecked={editRecipe?.active ?? true} /> Publish on storefront</label></div><div className="admin-form-actions"><button className="button button-red">Save recipe</button><button className="button button-outline" type="button" onClick={() => { setRecipeFormOpen(false); setEditRecipe(null); }}>Cancel</button></div></form>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>RECIPE</th><th>PREPARATION</th><th>INGREDIENTS</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{recipes.map((recipe) => <tr key={recipe._id}><td><div className="admin-product-name"><img src={recipe.image} alt="" /><strong>{recipe.title}<small>{recipe.slug}</small></strong></div></td><td>{recipe.prepMinutes} min</td><td>{recipe.ingredients.length}</td><td><span className={`status-pill ${recipe.active ? "status-on" : "status-off"}`}>{recipe.active ? "Published" : "Hidden"}</span></td><td><button className="admin-edit" onClick={() => { setEditRecipe(recipe); setRecipeFormOpen(true); }}>Edit</button><button className="admin-edit" onClick={() => void setRecipeVisibility(recipe)}>{recipe.active ? "Hide" : "Publish"}</button></td></tr>)}</tbody></table>{!recipes.length && <p className="admin-empty">No recipes yet. Add a recipe above.</p>}</div></section>}
        {tab === "reviews" && <section className="admin-card"><div className="admin-card-heading"><div><span className="eyebrow">VERIFIED CUSTOMER EXPERIENCES</span><h2>Review moderation</h2></div><span className="admin-count">{reviews.filter((review) => review.status === "pending").length} awaiting review</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>CUSTOMER</th><th>PRODUCT</th><th>RATING & REVIEW</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{reviews.map((review) => <tr key={review._id}><td><strong>{review.user?.name || "Customer"}</strong><small>{review.user?.email || "Account unavailable"}</small></td><td>{review.product?.name || review.productName}</td><td><div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />)}</div><small className="admin-review-comment">{review.comment}</small></td><td><span className={`status-pill ${review.status === "approved" ? "status-on" : review.status === "rejected" ? "status-off" : ""}`}>{review.status}</span></td><td><div className="admin-review-actions">{review.status !== "approved" && <button className="admin-edit" onClick={() => void updateReviewStatus(review._id, "approved")}>Approve</button>}{review.status !== "rejected" && <button className="admin-edit admin-review-reject" onClick={() => void updateReviewStatus(review._id, "rejected")}>{review.status === "approved" ? "Hide" : "Reject"}</button>}</div></td></tr>)}</tbody></table>{!reviews.length && <p className="admin-empty">No customer reviews have been submitted yet.</p>}</div></section>}
        {tab === "customers" && <section className="admin-card"><div className="admin-card-heading"><div><span className="eyebrow">YOUR COMMUNITY</span><h2>Customers</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>PHONE</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer._id}><td>{customer.name}</td><td>{customer.email}</td><td>{customer.phone || "—"}</td></tr>)}</tbody></table>{!customers.length && <p className="admin-empty">No customer accounts yet.</p>}</div></section>}
        {tab === "categories" && <section className="admin-card"><div className="admin-card-heading"><div><span className="eyebrow">HOW YOUR SHELVES ARE ORGANISED</span><h2>Categories</h2></div><span className="admin-count">{categories.length} categories</span></div><form key={editCategory?._id ?? "new-category"} className="category-create" onSubmit={(e) => void saveCategory(e)}><label>{editCategory ? "Category name" : "New category"}<input name="name" required minLength={2} defaultValue={editCategory?.name} placeholder="Ground Spices" /></label><label>URL slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={editCategory?.slug} placeholder="ground-spices" /></label><button className="button button-red">{editCategory ? "Save changes" : "Add category"} <Plus size={15} /></button>{editCategory && <button className="button button-outline" type="button" onClick={() => setEditCategory(null)}>Cancel</button>}</form><div className="category-list">{categories.filter((category) => !search || `${category.name} ${category.slug}`.toLowerCase().includes(search.toLowerCase())).map((category) => <div key={category._id}><Sparkles size={17} /><strong>{category.name}</strong><span>{category.slug}</span><button className="admin-edit" onClick={() => { setEditCategory(category); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button><button className="admin-edit admin-review-reject" onClick={() => void removeCategory(category)}>Remove</button></div>)}</div>{!categories.length && <p className="admin-empty">No categories yet. Add a category above.</p>}</section>}
        {tab === "messages" && <section className="admin-card"><div className="admin-card-heading"><div><span className="eyebrow">CUSTOMER CARE</span><h2>Contact messages</h2></div><span className="admin-count">{messages.filter((message) => message.status === "new").length} new · {messages.length} total</span></div><div className="admin-message-list">{messages.filter((message) => !search || `${message.name} ${message.email} ${message.subject} ${message.message}`.toLowerCase().includes(search.toLowerCase())).map((message) => <article className="admin-message" key={message._id}><div className="admin-message-heading"><div><span className={`status-pill ${message.status === "resolved" ? "status-on" : message.status === "new" ? "status-off" : ""}`}>{message.status}</span><h3>{message.subject}</h3><p>{message.name} · <a href={`mailto:${message.email}`}>{message.email}</a> · {new Date(message.createdAt).toLocaleDateString()}</p></div><label className="admin-message-status">Status<select aria-label={`Update message from ${message.name}`} value={message.status} onChange={(event) => void updateMessageStatus(message._id, event.target.value as AdminMessage["status"])}><option value="new">New</option><option value="read">Read</option><option value="resolved">Resolved</option></select></label></div><p className="admin-message-body">{message.message}</p></article>)}{!messages.length && <p className="admin-empty">No customer messages yet.</p>}</div></section>}
        {tab === "content" && <section className="admin-card"><div className="admin-card-heading"><div><span className="eyebrow">THE LITTLE DETAILS</span><h2>Store settings</h2></div></div><p className="muted">Configure checkout charges here. Delivery is calculated from the cart subtotal. VAT stays off until you enable it with a confirmed rate.</p><form className="settings-form checkout-settings-form" onSubmit={(e) => void saveCheckoutSettings(e)}><h3>Delivery & VAT</h3><label>Standard delivery fee (BDT)<input required type="number" min="0" step="0.01" value={checkoutForm.deliveryFee} onChange={(event) => setCheckoutForm((current) => ({ ...current, deliveryFee: event.target.value }))} placeholder="Enter your confirmed fee" /></label><label>Free delivery when subtotal reaches (BDT)<input type="number" min="0" step="0.01" value={checkoutForm.freeMinimum} onChange={(event) => setCheckoutForm((current) => ({ ...current, freeMinimum: event.target.value }))} placeholder="Leave blank to disable free delivery" /></label><label className="check-label"><input type="checkbox" checked={checkoutForm.vatEnabled} onChange={(event) => setCheckoutForm((current) => ({ ...current, vatEnabled: event.target.checked }))} /> Charge VAT at checkout</label><label>VAT rate (%)<input type="number" min="0" max="100" step="0.01" value={checkoutForm.vatRate} onChange={(event) => setCheckoutForm((current) => ({ ...current, vatRate: event.target.value }))} placeholder="Enter a confirmed rate" /></label><p className="settings-help">VAT is calculated on the product subtotal and added to the order total. Confirm the applicable rate and treatment before enabling it. Orders store the applied VAT amount and rate.</p><button className="button button-red" disabled={savingCheckout}>{savingCheckout ? "Saving…" : "Save delivery & VAT settings"} <Check size={16} /></button></form><div className="payment-setup-note"><h3>Online payments</h3><p>Online payment providers are not active yet. Secure gateway credentials and a verified payment initiation/callback flow are required before accepting bKash, Nagad or SSLCommerz payments. Cash on delivery remains available.</p></div><h3>Advanced settings</h3><p className="muted">Other store settings can be saved as JSON objects. Homepage content and coupons do not yet have dedicated management tools.</p><form className="settings-form" onSubmit={(e) => void saveSetting(e)}><label>Setting key<input name="key" required placeholder="homepage" /></label><label>JSON value<textarea name="value" rows={6} defaultValue={'{\n  "headline": ""\n}'} /></label><button className="button button-red">Save setting <Check size={16} /></button></form><h3>Saved settings</h3><div className="category-list">{settings.map((setting) => <details key={setting._id}><summary><strong>{setting.key}</strong> <ChevronDown size={15} /></summary><pre>{JSON.stringify(setting.value, null, 2)}</pre></details>)}</div>{!settings.length && <p className="admin-empty">No settings have been saved.</p>}</section>}
        {busy && <div className="admin-loading" role="status"><span className="spinner" /> Updating store data…</div>}
      </div>
    </section>
  </main>;
}

function AdminOrders({ orders, onUpdate }: { orders: AdminOrder[]; onUpdate: (id: string, status: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const visibleOrders = orders.filter((order) => {
    const matchesText = `${order.orderNumber} ${order.customer.name} ${order.customer.email} ${order.items.map((item) => item.name).join(" ")}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (status === "all" || order.status === status);
  });
  return <section className="admin-card"><div className="admin-card-heading"><div><span className="eyebrow">THE LATEST FROM YOUR TABLE</span><h2>Orders</h2></div><span className="admin-count">{visibleOrders.length} of {orders.length} orders</span></div><div className="admin-list-tools"><label className="admin-search"><Search size={15} /><input aria-label="Search orders" placeholder="Order number, shopper or item" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="admin-status-filter">Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ORDER</th><th>SHOPPER</th><th>DELIVERY TO</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th>UPDATE STATUS</th></tr></thead><tbody>{visibleOrders.map((order) => <tr key={order._id}><td><strong>{order.orderNumber}</strong><small className="table-sub">{new Date(order.createdAt).toLocaleDateString()}</small></td><td>{order.customer.name}<small className="table-sub">{order.customer.email}</small><small className="table-sub">{order.customer.phone}</small></td><td>{order.customer.address}<small className="table-sub">{order.customer.city}</small></td><td>{order.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}</td><td>{taka(order.total)}{order.subtotal !== undefined && <small className="table-sub">Items {taka(order.subtotal)} · Delivery {taka(order.shipping ?? 0)}{(order.tax ?? 0) > 0 ? ` · VAT ${taka(order.tax ?? 0)}` : ""}</small>}</td><td><span className="status-pill">{order.status}</span></td><td><select aria-label={`Update order ${order.orderNumber}`} value={order.status} onChange={(e) => onUpdate(order._id, e.target.value)}>{["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((value) => <option key={value} value={value}>{value}</option>)}</select></td></tr>)}</tbody></table>{!visibleOrders.length && <p className="admin-empty">{orders.length ? "No orders match this search and status." : "No orders yet."}</p>}</div></section>;
}

function App() {
  return <Routes>
    <Route path="/admin" element={<AdminPage />} />
    <Route path="*" element={<Shell><Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/product/:slug" element={<ProductPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/account/profile" element={<ProfilePage />} />
      <Route path="/account/addresses" element={<ProfilePage addressesOnly />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/our-story" element={<StoryPage />} />
      <Route path="/about" element={<StoryPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/recipes" element={<RecipesPage />} />
      <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
      <Route path="/track-order" element={<OrderTrackPage />} />
      <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
      <Route path="/shipping" element={<PolicyPage kind="shipping" />} />
      <Route path="/returns" element={<PolicyPage kind="returns" />} />
      <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
      <Route path="/terms" element={<PolicyPage kind="terms" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes></Shell>} />
  </Routes>;
}

export default App;
