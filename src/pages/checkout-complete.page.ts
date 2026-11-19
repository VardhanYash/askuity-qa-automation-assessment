import BasePage, { byTestId } from "./base.page.ts";

class CheckoutCompletePage extends BasePage {
  protected get root() {
    return $(byTestId("checkout-success-title"));
  }

  get title() {
    return $(byTestId("checkout-success-title"));
  }

  get message() {
    return $(byTestId("checkout-success-message"));
  }

  get continueShoppingButton() {
    return $(byTestId("back-to-home"));
  }

  async continueShopping(): Promise<void> {
    await this.click(this.continueShoppingButton);
  }
}

export default new CheckoutCompletePage();
