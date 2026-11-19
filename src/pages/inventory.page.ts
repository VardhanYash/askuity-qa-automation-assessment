import BasePage, { byTestId } from "./base.page.ts";
import type { Category, Product, SortOption } from "../data/products.ts";
import { logger } from "../utils/logger.ts";
import { parsePrice } from "../utils/price.ts";
import { waitForStable } from "../utils/wait.ts";

export interface InventoryCard {
  name: string;
  price: number;
}

class InventoryPage extends BasePage {
  protected get root() {
    return $(byTestId("inventory-page"));
  }

  get items() {
    return $$(byTestId("inventory-item"));
  }

  get categoryFilter() {
    return $(byTestId("filter-category"));
  }

  get sortSelect() {
    return $(byTestId("sort-select"));
  }

  get searchInput() {
    return $(byTestId("search-products"));
  }

  get emptyState() {
    return $(byTestId("inventory-empty-state"));
  }

  // "12 items to explore" has no data-test id, so anchor on the section heading it sits under
  get itemCountLabel() {
    return $("//h2[normalize-space()='The supply shelf']/following-sibling::p");
  }

  private card(product: Product) {
    return $(byTestId("inventory-container")).$(`.//*[@data-test="inventory-item"][.//*[@data-test="add-to-cart-${product.slug}"]]`);
  }

  addToCartButton(product: Product) {
    return $(byTestId(`add-to-cart-${product.slug}`));
  }

  quantityValue(product: Product) {
    return $(byTestId(`qty-value-${product.slug}`));
  }

  async getCards(): Promise<InventoryCard[]> {
    return waitForStable(
      () =>
        this.items.map(async (card) => ({
          name: (await card.$(byTestId("inventory-item-name")).getText()).trim(),
          price: parsePrice(await card.$(byTestId("inventory-item-price")).getText()),
        })),
      "inventory list",
    );
  }

  async getProductNames(): Promise<string[]> {
    return (await this.getCards()).map((card) => card.name);
  }

  async getDisplayedItemCount(): Promise<number> {
    return (await this.getCards()).length;
  }

  // The number in the "N items to explore" label
  async getItemCountLabel(): Promise<{ count: number; text: string }> {
    const text = await this.textOf(this.itemCountLabel);
    return { count: Number(text.match(/\d+/)?.[0] ?? NaN), text };
  }

  async filterByCategory(category: Category | "all"): Promise<void> {
    logger.step(`filter by category "${category}"`);
    await this.selectByValue(this.categoryFilter, category);
  }

  async sortBy(option: SortOption): Promise<void> {
    logger.step(`sort by "${option}"`);
    await this.selectByValue(this.sortSelect, option);
  }

  async search(term: string): Promise<void> {
    logger.step(`search for "${term}"`);
    await this.type(this.searchInput, term);
  }

  async setQuantity(product: Product, quantity: number): Promise<void> {
    const current = Number(await this.quantityValue(product).getText());
    const button = $(byTestId(`qty-${quantity > current ? "increase" : "decrease"}-${product.slug}`));
    for (let i = 0; i < Math.abs(quantity - current); i++) {
      await this.click(button);
    }
    await expect(this.quantityValue(product)).toHaveText(String(quantity));
  }

  async addToCart(product: Product, quantity = 1): Promise<void> {
    logger.step(`add ${quantity} x "${product.name}" to cart`);
    if (quantity !== 1) {
      await this.setQuantity(product, quantity);
    }
    await this.click(this.addToCartButton(product));
  }

  // Inline SVG markup of a product's image, used to compare artwork between users
  async getImageMarkup(product: Product): Promise<string> {
    const svg = this.card(product).$("svg");
    await svg.waitForExist();
    return svg.getHTML({ prettify: false });
  }
}

export default new InventoryPage();
