export type Category = "apparel" | "accessories" | "gear" | "books";

export interface Product {
  name: string;
  slug: string;
  price: number;
  category: Category;
}

export const PRODUCTS: Product[] = [
  { name: "After Hours Hoodie", slug: "sauce-labs-hoodie", price: 44.99, category: "apparel" },
  { name: "Bolt T-Shirt", slug: "bolt-t-shirt", price: 15.99, category: "apparel" },
  { name: "Branch Point Decals", slug: "qa-sticker-pack", price: 4.99, category: "accessories" },
  { name: "Bug Hunt Crew Socks", slug: "debug-socks", price: 8.99, category: "accessories" },
  { name: "Daybreak Ceramic Mug", slug: "sauce-labs-mug", price: 14.99, category: "accessories" },
  { name: "Gridline Journal", slug: "lab-notebook", price: 12.99, category: "accessories" },
  { name: "Little Trek Bodysuit", slug: "onesie", price: 7.99, category: "apparel" },
  { name: "Nightline Safety Light", slug: "bike-light", price: 9.99, category: "gear" },
  { name: "Side Quest Tee", slug: "all-the-things-t-shirt", price: 15.99, category: "apparel" },
  { name: "Signal Path Field Guide", slug: "automation-handbook", price: 24.99, category: "books" },
  { name: "Summit Fleece", slug: "fleece-jacket", price: 49.99, category: "apparel" },
  { name: "Trailmark Day Pack", slug: "backpack", price: 29.99, category: "gear" },
];

export const CATEGORY_OPTIONS: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "apparel", label: "Apparel" },
  { value: "accessories", label: "Accessories" },
  { value: "gear", label: "Gear" },
  { value: "books", label: "Books" },
];

export type SortOption = "name-az" | "name-za" | "price-low" | "price-high";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-az", label: "Name: A to Z" },
  { value: "name-za", label: "Name: Z to A" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export function productByName(name: string): Product {
  const product = PRODUCTS.find((p) => p.name === name);
  if (!product) {
    throw new Error(`Unknown product "${name}". Add it to src/data/products.ts.`);
  }
  return product;
}

export function productsInCategory(category: Category | "all"): Product[] {
  return category === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);
}

export const CART_SELECTION = {
  top: productByName("After Hours Hoodie"),
  middle: productByName("Gridline Journal"),
  bottom: productByName("Trailmark Day Pack"),
};
