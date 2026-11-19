import { CHECKOUT_ERRORS, DEFAULT_SHIPPING, ORDER_CONFIRMATION } from "../../data/checkout.ts";
import { CART_SELECTION } from "../../data/products.ts";
import { USERS } from "../../data/users.ts";
import { addProductsToCart, goToOrderSummary, loginAs, openCart } from "../../flows/shopping.flow.ts";
import CartPage from "../../pages/cart.page.ts";
import CheckoutCompletePage from "../../pages/checkout-complete.page.ts";
import CheckoutInfoPage from "../../pages/checkout-info.page.ts";
import CheckoutSummaryPage from "../../pages/checkout-summary.page.ts";
import Header from "../../pages/components/header.component.ts";
import InventoryPage from "../../pages/inventory.page.ts";
import { calculateExpectedTotals } from "../../utils/price.ts";

const { top, middle, bottom } = CART_SELECTION;

describe("Checkout", () => {
  beforeEach(async () => {
    await loginAs(USERS.shopper);
    await addProductsToCart([{ product: top, quantity: 2 }, { product: middle }, { product: bottom }]);
    await openCart();
  });

  it("TC-CHK-01 full checkout: shipping info, order summary, finish and confirmation", async () => {
    const cartLines = await CartPage.getLines();
    const cartTotals = await CartPage.getTotals();

    await CartPage.proceedToCheckout();
    await CheckoutInfoPage.waitForLoaded();
    expect(await CheckoutInfoPage.getPreviewTotal()).toBe(cartTotals.total);

    await CheckoutInfoPage.fillShippingInfo(DEFAULT_SHIPPING);
    await CheckoutInfoPage.continue();
    await CheckoutSummaryPage.waitForLoaded();

    await expect(CheckoutSummaryPage.title).toHaveText("Order Summary");
    expect(await CheckoutSummaryPage.getLines()).toEqual(cartLines);
    expect(await CheckoutSummaryPage.getShippingInfo()).toBe(
      `${DEFAULT_SHIPPING.firstName} ${DEFAULT_SHIPPING.lastName} — ${DEFAULT_SHIPPING.postalCode}`,
    );
    const summaryTotals = await CheckoutSummaryPage.getTotals();
    expect(summaryTotals).toEqual(calculateExpectedTotals(cartLines));
    expect(summaryTotals).toEqual(cartTotals);

    await CheckoutSummaryPage.finish();
    await CheckoutCompletePage.waitForLoaded();

    await expect(CheckoutCompletePage.title).toHaveText(ORDER_CONFIRMATION.title);
    await expect(CheckoutCompletePage.message).toHaveText(ORDER_CONFIRMATION.message);

    await CheckoutCompletePage.continueShopping();
    await InventoryPage.waitForLoaded();
    expect(await Header.getCartBadgeCount()).toBe(0);
  });

  it("TC-CHK-02 each shipping field is required, with a message naming that field @knownBug BUG-004", async () => {
    await CartPage.proceedToCheckout();
    await CheckoutInfoPage.waitForLoaded();

    await CheckoutInfoPage.continue();

    expect({
      firstName: await CheckoutInfoPage.getFieldError("firstName"),
      lastName: await CheckoutInfoPage.getFieldError("lastName"),
      postalCode: await CheckoutInfoPage.getFieldError("postalCode"),
    }).toEqual(CHECKOUT_ERRORS);
    expect(await CheckoutInfoPage.isFieldMarkedInvalid("firstName")).toBe(true);
    await expect(CheckoutSummaryPage.finishButton).not.toBeExisting();
  });

  it("TC-CHK-03 errors clear field by field and the form only submits when complete", async () => {
    await CartPage.proceedToCheckout();
    await CheckoutInfoPage.waitForLoaded();

    await CheckoutInfoPage.fillShippingInfo({ firstName: DEFAULT_SHIPPING.firstName, lastName: DEFAULT_SHIPPING.lastName });
    await CheckoutInfoPage.continue();

    expect(await CheckoutInfoPage.getFieldError("lastName")).toBeNull();
    expect(await CheckoutInfoPage.getFieldError("postalCode")).toBe(CHECKOUT_ERRORS.postalCode);
    expect(await CheckoutSummaryPage.isLoaded()).toBe(false);

    await CheckoutInfoPage.fillShippingInfo({ postalCode: DEFAULT_SHIPPING.postalCode });
    await CheckoutInfoPage.continue();
    await CheckoutSummaryPage.waitForLoaded();
  });

  it("TC-CHK-04 placing an order empties the cart @knownBug BUG-005", async () => {
    await goToOrderSummary(DEFAULT_SHIPPING);
    await CheckoutSummaryPage.finish();
    await CheckoutCompletePage.waitForLoaded();

    expect(await Header.getCartBadgeCount()).toBe(0);
    await openCart();
    await expect(CartPage.emptyTitle).toBeDisplayed();
  });
});
