import { CART_SELECTION, PRODUCTS } from "../../data/products.ts";
import { USERS } from "../../data/users.ts";
import { addProductsToCart, loginAs, openCart } from "../../flows/shopping.flow.ts";
import CartPage from "../../pages/cart.page.ts";
import Header from "../../pages/components/header.component.ts";
import InventoryPage from "../../pages/inventory.page.ts";

async function captureProductImages(): Promise<Record<string, string>> {
  const images: Record<string, string> = {};
  for (const product of PRODUCTS) {
    images[product.name] = await InventoryPage.getImageMarkup(product);
  }
  return images;
}

describe("Practice-account variations", () => {
  it(`TC-VAR-01 "${USERS.imageVariation.username}" sees the same product images as a standard shopper @knownBug BUG-006`, async () => {
    await loginAs(USERS.shopper);
    const baseline = await captureProductImages();

    await loginAs(USERS.imageVariation);
    const actual = await captureProductImages();

    const productByImage = Object.fromEntries(Object.entries(baseline).map(([name, svg]) => [svg, name]));
    const mismatched = PRODUCTS.filter((p) => actual[p.name] !== baseline[p.name]).map(
      (p) => `"${p.name}" shows the image of "${productByImage[actual[p.name]] ?? "an unknown product"}"`,
    );
    expect(mismatched).toEqual([]);
  });

  it(`TC-VAR-02 "${USERS.cartBadge.username}" sees a cart badge equal to the number of units in the cart @knownBug BUG-008`, async () => {
    const { top, bottom } = CART_SELECTION;
    await loginAs(USERS.cartBadge);

    await addProductsToCart([{ product: top }, { product: bottom }]);
    await openCart();

    const unitsInCart = await CartPage.getTitleItemCount();
    expect(unitsInCart).toBe(2);
    expect(await Header.getCartBadgeCount()).toBe(unitsInCart);
  });
});
