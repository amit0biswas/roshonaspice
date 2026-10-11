import { CategoryModel, ProductModel, RecipeModel } from "./models.js";

const products = [
  { name: "Garam Masala", slug: "garam-masala", category: "Blended Spices", price: 149, featured: true, image: "/assets/Roshona Garam Masala Spice Jar.png" },
  { name: "Turmeric Powder", slug: "turmeric-powder", category: "Ground Spices", price: 100, featured: true, image: "/assets/Roshona Turmeric Powder Jar.png" },
  { name: "Coriander Powder", slug: "coriander-powder", category: "Ground Spices", price: null, featured: false, image: "/assets/Roshona Coriander Powder Jar.png" },
  { name: "Red Chilli Powder", slug: "red-chilli-powder", category: "Ground Spices", price: null, featured: false, image: "/assets/Roshona Red Chilli Powder Jar.png" },
  { name: "Cumin Powder", slug: "cumin-powder", category: "Ground Spices", price: null, featured: false, image: "/assets/Roshona Cumin Powder Jar on Red.png" }
] as const;

const recipes = [
  {
    title: "Spiced Fish Curry",
    slug: "spiced-fish-curry",
    description: "Fish steaks gently simmered in a tomato, onion and ground-spice sauce. Serve hot with steamed rice.",
    image: "/assets/recipe-spiced-fish-curry.jpg",
    imageAlt: "A pan of Bengali-style fish curry",
    prepMinutes: 45,
    ingredients: [
      { quantity: "600 g", name: "firm fish steaks, such as rohu or tilapia" },
      { quantity: "1 tsp", name: "turmeric powder" },
      { quantity: "1 tsp", name: "ground cumin" },
      { quantity: "1 tsp", name: "ground coriander" },
      { quantity: "½ tsp", name: "red chilli powder, or to taste" },
      { quantity: "2 tbsp", name: "neutral cooking oil, plus more for frying" },
      { quantity: "1 medium", name: "onion, finely sliced" },
      { quantity: "2 medium", name: "ripe tomatoes, chopped" },
      { quantity: "1 tbsp", name: "fresh ginger and garlic, finely grated" },
      { quantity: "250 ml", name: "water" },
      { quantity: "to taste", name: "salt" },
      { quantity: "to finish", name: "fresh coriander leaves (optional)" }
    ],
    instructions: [
      "Pat the fish dry. Season with half the turmeric and salt. Leave while preparing the sauce.",
      "Heat a thin layer of oil in a wide pan over medium heat. Fry the fish in batches until lightly golden on both sides; remove to a plate.",
      "Add 2 tablespoons of oil to the pan. Cook the sliced onion until softened and golden at the edges, about 6 minutes.",
      "Stir in the ginger and garlic and cook for 30 seconds. Add tomatoes, cumin, coriander, chilli powder, the remaining turmeric and salt. Cook, stirring, until the tomatoes soften into a thick masala.",
      "Pour in the water and bring to a gentle simmer. Return the fish to the pan and spoon the sauce over it.",
      "Cover and simmer gently for 8–12 minutes, depending on the thickness of the fish, until it is cooked through and flakes easily. Avoid vigorous stirring. Finish with fresh coriander, if desired, and serve with rice."
    ]
  },
  {
    title: "Chicken Roast",
    slug: "chicken-roast",
    description: "A homestyle Bengali-inspired chicken roast: browned chicken braised in yoghurt, onion and a warmly spiced sauce.",
    image: "/assets/recipe-chicken-roast.jpg",
    imageAlt: "A plate of Bengali roasted chicken",
    prepMinutes: 30,
    ingredients: [
      { quantity: "800 g", name: "bone-in chicken pieces" },
      { quantity: "120 g", name: "plain unsweetened yoghurt" },
      { quantity: "1 medium", name: "onion, finely sliced" },
      { quantity: "1 tbsp", name: "fresh ginger and garlic, finely grated" },
      { quantity: "1 tsp", name: "garam masala" },
      { quantity: "½ tsp", name: "ground cumin" },
      { quantity: "½ tsp", name: "ground coriander" },
      { quantity: "½ tsp", name: "turmeric powder" },
      { quantity: "½ tsp", name: "red chilli powder, or to taste" },
      { quantity: "2 tbsp", name: "neutral cooking oil" },
      { quantity: "60 ml", name: "water" },
      { quantity: "to taste", name: "salt" }
    ],
    instructions: [
      "Mix the yoghurt with ginger, garlic, cumin, coriander, turmeric, chilli powder and salt. Coat the chicken and set aside while preparing the onion.",
      "Heat the oil in a heavy pan over medium heat. Cook the onion, stirring, until softened and golden.",
      "Lift the chicken pieces from the marinade and brown them on all sides in the pan, working in batches if needed.",
      "Return all the chicken to the pan. Add the remaining marinade and water, cover, and cook gently for about 18–22 minutes, turning the pieces once, until cooked through. The thickest piece should reach 74°C (165°F) on a food thermometer.",
      "Remove the lid and stir in the garam masala. Simmer for a few minutes until the sauce is glossy and clings to the chicken. Taste and adjust the salt before serving."
    ]
  },
  {
    title: "Classic Biryani",
    slug: "classic-biryani",
    description: "Fragrant basmati rice layered with spiced chicken, browned onions and yoghurt, then steamed together until tender.",
    image: "/assets/recipe-classic-biryani.jpg",
    imageAlt: "A plate of chicken biryani with fragrant rice",
    prepMinutes: 60,
    ingredients: [
      { quantity: "700 g", name: "bone-in chicken pieces" },
      { quantity: "400 g", name: "basmati rice, rinsed and soaked for 20 minutes" },
      { quantity: "150 g", name: "plain unsweetened yoghurt" },
      { quantity: "2 medium", name: "onions, thinly sliced" },
      { quantity: "1 tbsp", name: "fresh ginger and garlic, finely grated" },
      { quantity: "1 tsp", name: "garam masala" },
      { quantity: "1 tsp", name: "ground cumin" },
      { quantity: "½ tsp", name: "turmeric powder" },
      { quantity: "½ tsp", name: "red chilli powder, or to taste" },
      { quantity: "2 tbsp", name: "neutral cooking oil or ghee" },
      { quantity: "3", name: "green cardamom pods" },
      { quantity: "1 small", name: "cinnamon stick" },
      { quantity: "1", name: "bay leaf" },
      { quantity: "to taste", name: "salt" },
      { quantity: "to garnish", name: "fresh coriander and mint leaves (optional)" }
    ],
    instructions: [
      "Mix the yoghurt with ginger, garlic, garam masala, cumin, turmeric, chilli powder and salt. Coat the chicken and set aside.",
      "Heat the oil or ghee in a heavy lidded pot. Fry the sliced onions until deeply golden. Lift out about a third for the top.",
      "Add the cardamom, cinnamon and bay leaf to the pot. Stir for 30 seconds, then add the marinated chicken and all the remaining marinade.",
      "Cover and cook over medium-low heat for 20–25 minutes, turning once, until the chicken is nearly cooked and the sauce has thickened. Add a splash of water if the pan becomes dry.",
      "Meanwhile, boil the soaked rice in plenty of salted water until about three-quarters cooked; the grain should still have a firm centre. Drain well.",
      "Spread the rice over the chicken. Scatter the reserved onions and herbs over the top. Cover tightly and steam on the lowest heat for 12–15 minutes, until the rice is tender and the chicken is cooked through.",
      "Rest for 5 minutes. Gently lift the rice and chicken together to serve, keeping the layers as intact as possible."
    ]
  }
] as const;

async function seedBySlug(
  upsert: () => Promise<unknown>,
  findExisting: () => Promise<unknown>
): Promise<void> {
  try {
    await upsert();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000 &&
      await findExisting()
    ) {
      return;
    }
    throw error;
  }
}

export async function seedStore(): Promise<void> {
  for (const product of products) {
    await seedBySlug(
      () => ProductModel.updateOne(
        { slug: product.slug },
        { $setOnInsert: { ...product, description: product.name, weight: "100g", stock: 0, active: true } },
        { upsert: true }
      ),
      () => ProductModel.exists({ slug: product.slug })
    );
  }
  for (const category of [{ name: "Ground Spices", slug: "ground-spices" }, { name: "Blended Spices", slug: "blended-spices" }]) {
    await seedBySlug(
      () => CategoryModel.updateOne({ slug: category.slug }, { $setOnInsert: category }, { upsert: true }),
      () => CategoryModel.exists({ slug: category.slug })
    );
  }
  for (const recipe of recipes) {
    await seedBySlug(
      () => RecipeModel.updateOne({ slug: recipe.slug }, { $setOnInsert: { ...recipe, active: true } }, { upsert: true }),
      () => RecipeModel.exists({ slug: recipe.slug })
    );
  }
}
