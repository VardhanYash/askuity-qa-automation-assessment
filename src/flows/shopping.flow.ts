import type { ShippingInfo } from "../data/checkout.ts";
import type { Product } from "../data/products.ts";
import type { User } from "../data/users.ts";
import CartPage from "../pages/cart.page.ts";
import CheckoutInfoPage from "../pages/checkout-info.page.ts";
import CheckoutSummaryPage from "../pages/checkout-summary.page.ts";
import Header from "../pages/components/header.component.ts";
import InventoryPage from "../pages/inventory.page.ts";
import LoginPage from "../pages/login.page.ts";
import { logger } from "../utils/logger.ts";

// Fresh page load + login because app state is in-memory this also resets the cart
export async function loginAs(user: User): Promise<void> {
  logger.info(`Logging in as ${user.username} (${user.role})`);
  await LoginPage.open();
  await LoginPage.login(user.username, user.password);
  await InventoryPage.waitForLoaded();
}

export async function addProductsToCart(items: { product: Product; quantity?: number }[]): Promise<void> {
  for (const { product, quantity = 1 } of items) {
    await InventoryPage.addToCart(product, quantity);
  }
}

export async function openCart(): Promise<void> {
  await Header.openCart();
  await CartPage.waitForLoaded();
}

export async function goToOrderSummary(shipping: ShippingInfo): Promise<void> {
  await CartPage.proceedToCheckout();
  await CheckoutInfoPage.waitForLoaded();
  await CheckoutInfoPage.fillShippingInfo(shipping);
  await CheckoutInfoPage.continue();
  await CheckoutSummaryPage.waitForLoaded();
}
