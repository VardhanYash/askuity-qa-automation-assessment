import BasePage, { byTestId, byTestIdPrefix } from "./base.page.ts";
import { logger } from "../utils/logger.ts";
import { parsePrice, type Totals } from "../utils/price.ts";
import { waitForStable } from "../utils/wait.ts";

export interface CartLine {
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

class CartPage extends BasePage {
  protected get root() {
    return $(byTestId("cart-page"));
  }

  get title() {
    return $(byTestId("cart-title"));
  }

  get emptyTitle() {
    return $(byTestId("cart-empty-title"));
  }

  get emptyMessage() {
    return $(byTestId("cart-empty-message"));
  }

  get emptyContinueShoppingButton() {
    return $(byTestId("continue-shopping"));
  }

  get continueShoppingLink() {
    return $(byTestId("continue-shopping-link"));
  }

  get checkoutButton() {
    return $(byTestId("checkout-button"));
  }

  get summary() {
    return $(byTestId("cart-summary"));
  }

  get lines() {
    return $$(byTestId("cart-item"));
  }

  private line(name: string) {
    return $(`//*[@data-test="cart-item"][.//*[@data-test="cart-item-name" and normalize-space()="${name}"]]`);
  }

  async getLines(): Promise<CartLine[]> {
    return waitForStable(
      () =>
        this.lines.map(async (line) => ({
          name: (await line.$(byTestId("cart-item-name")).getText()).trim(),
          unitPrice: parsePrice(await line.$(byTestId("cart-item-price")).getText()),
          quantity: Number(await line.$(byTestIdPrefix("quantity-item-")).getText()),
          lineTotal: parsePrice(await line.$(byTestIdPrefix("cart-item-total-")).getText()),
        })),
      "cart lines",
    );
  }

  async getQuantity(name: string): Promise<number> {
    return Number(await this.line(name).$(byTestIdPrefix("quantity-item-")).getText());
  }

  // Your Cart counts units not distinct products
  async getTitleItemCount(): Promise<number> {
    const text = await this.textOf(this.title);
    return Number(text.match(/\((\d+)\s+items?\)/)?.[1] ?? NaN);
  }

  async increaseQuantity(name: string): Promise<void> {
    await this.changeQuantity(name, "increase", 1);
  }

  async decreaseQuantity(name: string): Promise<void> {
    await this.changeQuantity(name, "decrease", -1);
  }

  private async changeQuantity(name: string, direction: "increase" | "decrease", delta: 1 | -1): Promise<void> {
    logger.step(`${direction} quantity of "${name}"`);
    const before = await this.getQuantity(name);
    await this.click(this.line(name).$(byTestIdPrefix(`${direction}-qty-item-`)));
    const expected = before + delta;
    if (expected === 0) {
      await this.line(name).waitForExist({ reverse: true, timeoutMsg: `"${name}" was not removed at quantity 0` });
    } else {
      await browser.waitUntil(async () => (await this.getQuantity(name)) === expected, {
        timeoutMsg: `Quantity of "${name}" did not change to ${expected}`,
      });
    }
  }

  async removeLine(name: string): Promise<void> {
    logger.step(`remove "${name}" from cart`);
    await this.click(this.line(name).$(byTestIdPrefix("remove-item-")));
    await this.line(name).waitForExist({ reverse: true });
  }

  async getTotals(): Promise<Totals> {
    return waitForStable(
      async () => ({
        subtotal: parsePrice(await this.textOf($(byTestId("cart-subtotal")))),
        tax: parsePrice(await this.textOf($(byTestId("cart-tax")))),
        total: parsePrice(await this.textOf($(byTestId("cart-total")))),
      }),
      "cart totals",
    );
  }

  async isEmpty(): Promise<boolean> {
    return this.emptyTitle.isDisplayed();
  }

  async proceedToCheckout(): Promise<void> {
    await this.click(this.checkoutButton);
  }

  async continueShopping(): Promise<void> {
    const button = (await this.isEmpty()) ? this.emptyContinueShoppingButton : this.continueShoppingLink;
    await this.click(button);
  }
}

export default new CartPage();
