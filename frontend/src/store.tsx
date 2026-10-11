import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const API = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "") ?? "";

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  category: string;
  price: number | null;
  compareAtPrice?: number | null;
  weight: string;
  stock: number;
  active: boolean;
  featured: boolean;
};
export type CartLine = { product: Product; quantity: number };
export type User = { id: string; name: string; email: string; role: "customer" | "admin" };
export type Recipe = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  imageAlt: string;
  prepMinutes: number;
  ingredients: Array<{ name: string; quantity: string }>;
  instructions: string[];
  active?: boolean;
};
export type Review = {
  _id: string;
  rating: number;
  comment: string;
  productName: string;
  createdAt: string;
  user: { name: string } | null;
};
type StoreContextValue = {
  products: Product[];
  loading: boolean;
  cart: CartLine[];
  user: User | null;
  wishlist: string[];
  recipeWishlist: string[];
  notice: string;
  refreshProducts: () => Promise<void>;
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
  addToCart: (product: Product) => void;
  changeQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  toggleWishlist: (product: Product) => Promise<void>;
  toggleRecipeWishlist: (recipeId: string) => Promise<void>;
  clearCart: () => void;
  setUser: (user: User | null) => void;
  flash: (message: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}/api${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init.headers }
    });
  } catch {
    throw new Error("Unable to reach the store right now. Check your connection and try again.");
  }
  if (!response.ok) {
    let message: string | undefined;
    try {
      const data = await response.json() as { error?: string };
      message = data.error;
    } catch {
      message = undefined;
    }
    if (response.status >= 500 && (!message || message === "An unexpected server error occurred.")) {
      throw new Error(`The store API returned HTTP ${response.status}. Restart the backend server and try again.`);
    }
    if (message) throw new Error(message);
    throw new Error(`The request could not be completed (HTTP ${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const initialProducts: Product[] = [
  { _id: "garam-masala", slug: "garam-masala", name: "Garam Masala", category: "Blended Spices", image: "/assets/Roshona Garam Masala Spice Jar.png", description: "Garam Masala", price: 149, weight: "100g", stock: 0, active: true, featured: true },
  { _id: "turmeric-powder", slug: "turmeric-powder", name: "Turmeric Powder", category: "Ground Spices", image: "/assets/Roshona Turmeric Powder Jar.png", description: "Turmeric Powder", price: 100, weight: "100g", stock: 0, active: true, featured: true },
  { _id: "coriander-powder", slug: "coriander-powder", name: "Coriander Powder", category: "Ground Spices", image: "/assets/Roshona Coriander Powder Jar.png", description: "Coriander Powder", price: null, weight: "100g", stock: 0, active: true, featured: false },
  { _id: "red-chilli-powder", slug: "red-chilli-powder", name: "Red Chilli Powder", category: "Ground Spices", image: "/assets/Roshona Red Chilli Powder Jar.png", description: "Red Chilli Powder", price: null, weight: "100g", stock: 0, active: true, featured: false },
  { _id: "cumin-powder", slug: "cumin-powder", name: "Cumin Powder", category: "Ground Spices", image: "/assets/Roshona Cumin Powder Jar on Red.png", description: "Cumin Powder", price: null, weight: "100g", stock: 0, active: true, featured: false }
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem("roshona-cart") ?? "[]") as CartLine[]; } catch { return []; }
  });
  const [user, setUserState] = useState<User | null>(null);
  const [cartReady, setCartReady] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recipeWishlist, setRecipeWishlist] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  const request = useCallback(<T,>(path: string, init?: RequestInit) => apiRequest<T>(path, init), []);
  const refreshProducts = useCallback(async () => {
    try {
      const result = await apiRequest<{ products: Product[] }>("/products");
      setProducts(result.products);
    } catch (error) {
      if (error instanceof Error) console.warn("Live catalog unavailable; showing the provided product catalog.", error.message);
    } finally { setLoading(false); }
  }, []);
  const flash = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }, []);
  const setUser = useCallback((nextUser: User | null) => {
    setCartReady(false);
    setUserState(nextUser);
  }, []);

  useEffect(() => {
    void refreshProducts();
    void apiRequest<{ user: User & { wishlist?: Array<string | { _id: string }> } }>("/auth/me")
      .then(({ user: activeUser }) => {
        setUserState(activeUser);
        setWishlist(activeUser.wishlist?.map((id) => typeof id === "string" ? id : id._id) ?? []);
      })
      .catch(() => setUserState(null))
      .finally(() => setCartReady(true));
  }, [refreshProducts]);

  useEffect(() => { localStorage.setItem("roshona-cart", JSON.stringify(cart)); }, [cart]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setCartReady(false);
    void apiRequest<{ cart: { items: Array<{ product: Product | null; quantity: number }> } }>("/cart")
      .then(({ cart: savedCart }) => {
        if (!cancelled) setCart(savedCart.items.flatMap((line) => line.product ? [{ product: line.product, quantity: line.quantity }] : []));
      })
      .catch((error: unknown) => { if (!cancelled && error instanceof Error) flash(error.message); })
      .finally(() => { if (!cancelled) setCartReady(true); });
    return () => { cancelled = true; };
  }, [user, flash]);

  useEffect(() => {
    if (!user) { setRecipeWishlist([]); return; }
    let cancelled = false;
    void apiRequest<{ recipes: Array<Recipe | string> }>("/account/recipe-wishlist")
      .then(({ recipes }) => {
        if (!cancelled) setRecipeWishlist(recipes.map((recipe) => typeof recipe === "string" ? recipe : recipe._id));
      })
      .catch((error: unknown) => { if (!cancelled && error instanceof Error) flash(error.message); });
    return () => { cancelled = true; };
  }, [user, flash]);

  useEffect(() => {
    if (!user || !cartReady) return;
    void apiRequest("/cart", {
      method: "PUT",
      body: JSON.stringify({ items: cart.map((line) => ({ productId: line.product._id, quantity: line.quantity })) })
    }).catch((error: unknown) => { if (error instanceof Error) flash(error.message); });
  }, [cart, cartReady, flash, user]);

  const addToCart = useCallback((product: Product) => {
    if (product.price == null) {
      flash("The price for this spice has not been confirmed yet.");
      return;
    }
    if (product.stock < 1) {
      flash("This spice is not available until the store confirms its stock.");
      return;
    }
    if (cart.find((line) => line.product._id === product._id)?.quantity === 50) {
      flash("You can add up to 50 of this spice per order.");
      return;
    }
    setCart((lines) => {
      const found = lines.find((line) => line.product._id === product._id);
      return found
        ? lines.map((line) => line.product._id === product._id ? { ...line, quantity: line.quantity + 1 } : line)
        : [...lines, { product, quantity: 1 }];
    });
    flash(`${product.name} added to your bag.`);
  }, [cart, flash]);

  const changeQuantity = useCallback((productId: string, delta: number) => {
    setCart((lines) => lines.flatMap((line) => {
      if (line.product._id !== productId) return [line];
      const next = line.quantity + delta;
      if (next <= 0) return [];
      return [{ ...line, quantity: Math.min(next, 50) }];
    }));
  }, []);
  const removeFromCart = useCallback((productId: string) => setCart((lines) => lines.filter((line) => line.product._id !== productId)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const toggleWishlist = useCallback(async (product: Product) => {
    if (!user) {
      flash("Sign in to save your favourites.");
      return;
    }
    try {
      const result = await request<{ wishlist: Array<string | { _id: string }> }>("/account/wishlist", {
        method: "PUT", body: JSON.stringify({ productId: product._id })
      });
      setWishlist(result.wishlist.map((id) => typeof id === "string" ? id : id._id));
      flash(wishlist.includes(product._id) ? "Removed from your favourites." : "Saved to your favourites.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not update favourites."); }
  }, [flash, request, user, wishlist]);

  const toggleRecipeWishlist = useCallback(async (recipeId: string) => {
    if (!user) {
      flash("Sign in to save recipes to your favourites.");
      return;
    }
    try {
      const result = await request<{ recipeWishlist: Array<string | { _id: string }> }>("/account/recipe-wishlist", {
        method: "PUT", body: JSON.stringify({ recipeId })
      });
      setRecipeWishlist(result.recipeWishlist.map((id) => typeof id === "string" ? id : id._id));
      flash(recipeWishlist.includes(recipeId) ? "Removed from your recipe favourites." : "Saved to your recipe favourites.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not update recipe favourites."); }
  }, [flash, recipeWishlist, request, user]);

  const value = useMemo(() => ({
    products, loading, cart, user, wishlist, recipeWishlist, notice, refreshProducts, request, addToCart,
    changeQuantity, removeFromCart, toggleWishlist, toggleRecipeWishlist, clearCart, setUser, flash
  }), [products, loading, cart, user, wishlist, recipeWishlist, notice, refreshProducts, request, addToCart, changeQuantity, removeFromCart, toggleWishlist, toggleRecipeWishlist, clearCart, flash]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used within StoreProvider.");
  return value;
}
