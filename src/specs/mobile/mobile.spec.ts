import { DEFAULT_SHIPPING, ORDER_CONFIRMATION } from "../../data/checkout.ts";
import { CART_SELECTION, PRODUCTS, productsInCategory } from "../../data/products.ts";
import { USERS } from "../../data/users.ts";
import { addProductsToCart, loginAs, openCart } from "../../flows/shopping.flow.ts";
import CartPage from "../../pages/cart.page.ts";
import CheckoutCompletePage from "../../pages/checkout-complete.page.ts";
import CheckoutInfoPage from "../../pages/checkout-info.page.ts";
import CheckoutSummaryPage from "../../pages/checkout-summary.page.ts";
import Header from "../../pages/components/header.component.ts";
import InventoryPage from "../../pages/inventory.page.ts";
import LoginPage from "../../pages/login.page.ts";
import { calculateExpectedTotals } from "../../utils/price.ts";
import { fitsViewportWidth, getViewportWidth, hasHorizontalOverflow, isStackedBelow } from "../../utils/viewport.ts";

const { top, bottom } = CART_SELECTION;

describe("Mobile (390x844 emulated phone)", () => {
  before(async () => {
    await LoginPage.open();
    expect(await getViewportWidth()).toBeLessThanOrEqual(430);
  });

  it("TC-MOB-01 login page fits the screen and an accepted user can log in", async () => {
    await LoginPage.open();

    expect(await hasHorizontalOverflow()).toBe(false);
    expect(await fitsViewportWidth(LoginPage.loginButton)).toBe(true);

    await LoginPage.login(USERS.shopper.username, USERS.shopper.password);
    await InventoryPage.waitForLoaded();

    expect(await fitsViewportWidth(Header.cartLink)).toBe(true);
    expect(await fitsViewportWidth(Header.logoutButton)).toBe(true);
  });

  it("TC-MOB-02 the locked user is rejected and the error is readable on screen", async () => {
    await LoginPage.open();
    await LoginPage.login(USERS.locked.username, USERS.locked.password);

    await expect(LoginPage.errorMessage).toBeDisplayed();
    expect(await fitsViewportWidth(LoginPage.errorMessage)).toBe(true);
  });

  it("TC-MOB-03 products page fits the screen and filter/sort work", async () => {
    await loginAs(USERS.shopper);

    expect(await hasHorizontalOverflow()).toBe(false);
    expect(await InventoryPage.getDisplayedItemCount()).toBe(PRODUCTS.length);
    expect(await fitsViewportWidth(InventoryPage.categoryFilter)).toBe(true);
    expect(await fitsViewportWidth(InventoryPage.sortSelect)).toBe(true);

    await InventoryPage.filterByCategory("accessories");
    expect(await InventoryPage.getDisplayedItemCount()).toBe(productsInCategory("accessories").length);

    await InventoryPage.sortBy("price-low");
    const prices = (await InventoryPage.getCards()).map((c) => c.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(await hasHorizontalOverflow()).toBe(false);
  });

  it("TC-MOB-04 cart: add top and bottom items, change quantity, totals correct, summary stacks below items", async () => {
    await loginAs(USERS.shopper);
    await addProductsToCart([{ product: top }, { product: bottom }]);
    await Header.waitForCartBadgeCount(2);

    await openCart();
    await CartPage.increaseQuantity(bottom.name);

    expect(await hasHorizontalOverflow()).toBe(false);
    expect(await CartPage.getQuantity(bottom.name)).toBe(2);
    expect(await Header.getCartBadgeCount()).toBe(3);
    expect(await CartPage.getTotals()).toEqual(calculateExpectedTotals(await CartPage.getLines()));

    const lastLine = (await CartPage.lines.getElements()).at(-1)!;
    expect(await isStackedBelow(CartPage.summary, lastLine)).toBe(true);
    expect(await fitsViewportWidth(CartPage.checkoutButton)).toBe(true);
  });

  it("TC-MOB-05 checkout end-to-end fits the screen at every step", async () => {
    await loginAs(USERS.shopper);
    await addProductsToCart([{ product: top }, { product: bottom }]);
    await openCart();
    const cartTotals = await CartPage.getTotals();

    await CartPage.proceedToCheckout();
    await CheckoutInfoPage.waitForLoaded();
    expect(await hasHorizontalOverflow()).toBe(false);

    await CheckoutInfoPage.fillShippingInfo(DEFAULT_SHIPPING);
    await CheckoutInfoPage.continue();
    await CheckoutSummaryPage.waitForLoaded();
    expect(await hasHorizontalOverflow()).toBe(false);
    expect(await CheckoutSummaryPage.getTotals()).toEqual(cartTotals);
    expect(await fitsViewportWidth(CheckoutSummaryPage.finishButton)).toBe(true);

    await CheckoutSummaryPage.finish();
    await CheckoutCompletePage.waitForLoaded();
    await expect(CheckoutCompletePage.title).toHaveText(ORDER_CONFIRMATION.title);
    expect(await fitsViewportWidth(CheckoutCompletePage.continueShoppingButton)).toBe(true);
  });
});
