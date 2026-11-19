import BasePage, { byTestId } from "./base.page.ts";
import { parsePrice, type Totals } from "../utils/price.ts";
import { waitForStable } from "../utils/wait.ts";
import type { CartLine } from "./cart.page.ts";

class CheckoutSummaryPage extends BasePage {
  protected get root() {
    return $(byTestId("checkout-summary-page"));
  }

  get title() {
    return $(byTestId("checkout-title"));
  }

  get shippingInfo() {
    return $(byTestId("shipping-info"));
  }

  get finishButton() {
    return $(byTestId("finish-button"));
  }

  get lines() {
    return $$(byTestId("checkout-item"));
  }

  async getLines(): Promise<CartLine[]> {
    return waitForStable(
      () =>
        this.lines.map(async (line) => {
          const qtyText = await line.$(byTestId("checkout-item-qty")).getText();
          return {
            name: (await line.$(byTestId("checkout-item-name")).getText()).trim(),
            unitPrice: parsePrice(qtyText),
            quantity: Number(qtyText.match(/Qty:\s*(\d+)/)?.[1] ?? NaN),
            lineTotal: parsePrice(await line.$(byTestId("checkout-item-subtotal")).getText()),
          };
        }),
      "order summary lines",
    );
  }

  async getShippingInfo(): Promise<string> {
    return this.textOf(this.shippingInfo);
  }

  async getTotals(): Promise<Totals> {
    return {
      subtotal: parsePrice(await this.textOf($(byTestId("checkout-subtotal")))),
      tax: parsePrice(await this.textOf($(byTestId("checkout-tax")))),
      total: parsePrice(await this.textOf($(byTestId("checkout-total")))),
    };
  }

  async finish(): Promise<void> {
    await this.click(this.finishButton);
  }
}

export default new CheckoutSummaryPage();
