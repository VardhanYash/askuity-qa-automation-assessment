import BasePage, { byTestId } from "../base.page.ts";

class HeaderComponent extends BasePage {
  protected get root() {
    return $(byTestId("header"));
  }

  get cartLink() {
    return $(byTestId("nav-cart"));
  }

  get shopLink() {
    return $(byTestId("nav-inventory"));
  }

  get cartBadge() {
    return $(byTestId("cart-badge"));
  }

  get loggedInUser() {
    return $(byTestId("logged-in-user"));
  }

  get logoutButton() {
    return $(byTestId("logout-button"));
  }

  /** The badge is removed from the DOM when the cart is empty, so a missing badge means 0. */
  async getCartBadgeCount(): Promise<number> {
    if (!(await this.cartBadge.isExisting())) return 0;
    return Number(await this.cartBadge.getText());
  }

  async waitForCartBadgeCount(expected: number): Promise<void> {
    await browser.waitUntil(async () => (await this.getCartBadgeCount()) === expected, {
      timeoutMsg: `Cart badge never showed ${expected} (last value: ${await this.getCartBadgeCount()})`,
    });
  }

  async getLoggedInUsername(): Promise<string> {
    return this.textOf(this.loggedInUser);
  }

  async openCart(): Promise<void> {
    await this.click(this.cartLink);
  }

  async openShop(): Promise<void> {
    await this.click(this.shopLink);
  }

  async logout(): Promise<void> {
    await this.click(this.logoutButton);
  }
}

export default new HeaderComponent();
