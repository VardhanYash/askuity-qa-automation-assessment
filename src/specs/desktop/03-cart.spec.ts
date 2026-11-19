import { CART_SELECTION, PRODUCTS, productByName } from "../../data/products.ts";
import { USERS } from "../../data/users.ts";
import { addProductsToCart, loginAs, openCart } from "../../flows/shopping.flow.ts";
import CartPage from "../../pages/cart.page.ts";
import Header from "../../pages/components/header.component.ts";
import InventoryPage from "../../pages/inventory.page.ts";
import { calculateExpectedTotals, lineTotal } from "../../utils/price.ts";

const { top, middle, bottom } = CART_SELECTION;

async function expectCartTotalsToMatchLines(): Promise<void> {
  const lines = await CartPage.getLines();
  for (const line of lines) {
    expect(line.lineTotal).toBe(lineTotal(line));
  }
  expect(await CartPage.getTotals()).toEqual(calculateExpectedTotals(lines));
}

describe("Cart", () => {
  beforeEach(async () => {
    await loginAs(USERS.shopper);
  });

  it("TC-CART-01 a new session starts with an empty cart and Continue Shopping returns to products", async () => {
    expect(await Header.getCartBadgeCount()).toBe(0);

    await openCart();

    await expect(CartPage.emptyTitle).toHaveText("Your cart is empty");
    await expect(CartPage.emptyMessage).toHaveText("Head back to the store and add some items.");
    await expect(CartPage.checkoutButton).not.toBeExisting();
    await expect(CartPage.lines).toBeElementsArrayOfSize(0);

    await CartPage.continueShopping();
    await InventoryPage.waitForLoaded();
  });

  it("TC-CART-02 items from the top and bottom of the list are added and the cart total is correct", async () => {
    await addProductsToCart([{ product: top }, { product: middle }, { product: bottom }]);
    await Header.waitForCartBadgeCount(3);

    await openCart();
    const lines = await CartPage.getLines();

    expect(lines.map((l) => l.name).sort()).toEqual([top.name, middle.name, bottom.name].sort());
    for (const line of lines) {
      expect(line.quantity).toBe(1);
      expect(line.unitPrice).toBe(productByName(line.name).price);
    }
    expect(await CartPage.getTitleItemCount()).toBe(3);
    expect((await CartPage.getTotals()).subtotal).toBe(calculateExpectedTotals(lines).subtotal);
  });

  it("TC-CART-03 the product-card quantity stepper adds that many units", async () => {
    await addProductsToCart([{ product: top, quantity: 3 }]);
    await Header.waitForCartBadgeCount(3);

    await openCart();

    expect(await CartPage.getQuantity(top.name)).toBe(3);
  });

  it("TC-CART-04 (+) and (-) update quantities, item count, badge and line totals", async () => {
    await addProductsToCart([{ product: top }, { product: bottom }]);
    await openCart();

    await CartPage.increaseQuantity(top.name);
    await CartPage.increaseQuantity(top.name);
    await CartPage.increaseQuantity(bottom.name);
    expect(await CartPage.getQuantity(top.name)).toBe(3);
    expect(await CartPage.getQuantity(bottom.name)).toBe(2);
    expect(await CartPage.getTitleItemCount()).toBe(5);
    expect(await Header.getCartBadgeCount()).toBe(5);

    await CartPage.decreaseQuantity(top.name);
    expect(await CartPage.getQuantity(top.name)).toBe(2);
    expect(await CartPage.getTitleItemCount()).toBe(4);
    expect(await Header.getCartBadgeCount()).toBe(4);

    await expectCartTotalsToMatchLines();
  });

  it("TC-CART-05 decreasing a quantity of 1 removes the line, the remove button removes a line", async () => {
    await addProductsToCart([{ product: top }, { product: middle }, { product: bottom }]);
    await openCart();

    await CartPage.decreaseQuantity(middle.name);
    await CartPage.removeLine(bottom.name);

    expect((await CartPage.getLines()).map((l) => l.name)).toEqual([top.name]);
    expect(await Header.getCartBadgeCount()).toBe(1);

    await CartPage.removeLine(top.name);
    await expect(CartPage.emptyTitle).toBeDisplayed();
    expect(await Header.getCartBadgeCount()).toBe(0);
  });

  it("TC-CART-06 subtotal, 8% tax and total match a manual calculation", async () => {
    await addProductsToCart([{ product: top, quantity: 2 }, { product: middle }, { product: bottom }]);
    await openCart();
    await expectCartTotalsToMatchLines();

    await CartPage.increaseQuantity(bottom.name);
    await expectCartTotalsToMatchLines();

    await CartPage.decreaseQuantity(top.name);
    await expectCartTotalsToMatchLines();
  });

  it("TC-CART-07 the cart keeps its contents when navigating back to the shop", async () => {
    await addProductsToCart([{ product: top }]);
    await openCart();
    await CartPage.continueShopping();
    await InventoryPage.waitForLoaded();

    await addProductsToCart([{ product: bottom }]);
    await openCart();

    expect((await CartPage.getLines()).map((l) => l.name).sort()).toEqual([top.name, bottom.name].sort());
  });

  for (const product of PRODUCTS) {
    const knownBug = product.name === "Bolt T-Shirt" ? " @knownBug BUG-002" : "";
    it(`TC-CART-08 "${product.name}" can be added to the cart${knownBug}`, async () => {
      await InventoryPage.addToCart(product);

      await Header.waitForCartBadgeCount(1);
      await openCart();
      expect((await CartPage.getLines()).map((l) => l.name)).toEqual([product.name]);
    });
  }
});
