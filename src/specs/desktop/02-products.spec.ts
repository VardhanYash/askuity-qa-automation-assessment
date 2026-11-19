import { CATEGORY_OPTIONS, PRODUCTS, SORT_OPTIONS, productsInCategory, type SortOption } from "../../data/products.ts";
import { USERS } from "../../data/users.ts";
import { loginAs } from "../../flows/shopping.flow.ts";
import InventoryPage, { type InventoryCard } from "../../pages/inventory.page.ts";

const byName = (a: InventoryCard, b: InventoryCard) => a.name.localeCompare(b.name);

const EXPECTED_ORDER: Record<SortOption, (cards: InventoryCard[]) => InventoryCard[]> = {
  "name-az": (cards) => [...cards].sort(byName),
  "name-za": (cards) => [...cards].sort(byName).reverse(),
  "price-low": (cards) => [...cards].sort((a, b) => a.price - b.price),
  "price-high": (cards) => [...cards].sort((a, b) => b.price - a.price),
};

describe("Products page", () => {
  beforeEach(async () => {
    await loginAs(USERS.shopper);
  });

  it("TC-PROD-01 shows the total count of items available", async () => {
    const displayed = await InventoryPage.getDisplayedItemCount();
    const label = await InventoryPage.getItemCountLabel();

    expect(displayed).toBe(PRODUCTS.length);
    expect(label.count).toBe(displayed);
  });

  it("TC-PROD-02 lists every catalogue product with the correct price", async () => {
    const cards = await InventoryPage.getCards();

    expect(cards).toEqual(
      expect.arrayContaining(PRODUCTS.map(({ name, price }) => ({ name, price }))),
    );
  });

  for (const { value, label } of CATEGORY_OPTIONS) {
    it(`TC-PROD-03 filtering by "${label}" shows only and all of its items`, async () => {
      const expected = productsInCategory(value).map((p) => p.name).sort();

      await InventoryPage.filterByCategory(value);
      const names = await InventoryPage.getProductNames();
      const countLabel = await InventoryPage.getItemCountLabel();

      expect([...names].sort()).toEqual(expected);
      expect(names.length).toBe(expected.length);
      expect(countLabel.count).toBe(expected.length);
    });
  }

  it("TC-PROD-04 the item count label is grammatical for a single item @knownBug BUG-007", async () => {
    await InventoryPage.filterByCategory("books");

    expect((await InventoryPage.getItemCountLabel()).text).toBe("1 item to explore");
  });

  for (const { value, label } of SORT_OPTIONS) {
    const knownBug = value === "price-high" ? " @knownBug BUG-001" : "";
    it(`TC-PROD-05 sorting by "${label}" orders the items correctly${knownBug}`, async () => {
      // Start from a different order so a no-op sort cannot pass by accident.
      await InventoryPage.sortBy(value === "name-za" ? "price-low" : "name-za");
      await InventoryPage.sortBy(value);

      const cards = await InventoryPage.getCards();

      expect(cards.length).toBe(PRODUCTS.length);
      expect(cards.map((c) => `${c.name} $${c.price}`)).toEqual(
        EXPECTED_ORDER[value](cards).map((c) => `${c.name} $${c.price}`),
      );
    });
  }

  it("TC-PROD-06 sorting is preserved within a category filter", async () => {
    await InventoryPage.filterByCategory("apparel");
    await InventoryPage.sortBy("price-low");

    const cards = await InventoryPage.getCards();

    expect(cards.length).toBe(productsInCategory("apparel").length);
    expect(cards).toEqual(EXPECTED_ORDER["price-low"](cards));
  });

  it("TC-PROD-07 search is case-insensitive and shows an empty state when nothing matches", async () => {
    await InventoryPage.search("TEE");
    expect(await InventoryPage.getProductNames()).toEqual(["Bolt T-Shirt", "Side Quest Tee"]);

    await InventoryPage.search("zzz-no-match");
    await expect(InventoryPage.emptyState).toBeDisplayed();
    expect(await InventoryPage.getDisplayedItemCount()).toBe(0);
  });
});
