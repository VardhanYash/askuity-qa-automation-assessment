import BasePage, { byTestId } from "./base.page.ts";
import type { ShippingInfo } from "../data/checkout.ts";
import { logger } from "../utils/logger.ts";
import { parsePrice } from "../utils/price.ts";

export type ShippingField = keyof ShippingInfo;

const FIELD_IDS: Record<ShippingField, { input: string; error: string }> = {
  firstName: { input: "checkout-first-name", error: "first-name-error" },
  lastName: { input: "checkout-last-name", error: "last-name-error" },
  postalCode: { input: "checkout-postal-code", error: "postal-code-error" },
};

class CheckoutInfoPage extends BasePage {
  protected get root() {
    return $(byTestId("checkout-page"));
  }

  get continueButton() {
    return $(byTestId("continue-to-summary"));
  }

  get backToCartLink() {
    return $(byTestId("back-to-cart"));
  }

  get previewTotal() {
    return $(byTestId("preview-total"));
  }

  input(field: ShippingField) {
    return $(byTestId(FIELD_IDS[field].input));
  }

  error(field: ShippingField) {
    return $(byTestId(FIELD_IDS[field].error));
  }

  async fillShippingInfo(info: Partial<ShippingInfo>): Promise<void> {
    logger.step(`fill shipping info ${JSON.stringify(info)}`);
    for (const field of Object.keys(info) as ShippingField[]) {
      await this.type(this.input(field), info[field] ?? "");
    }
  }

  async continue(): Promise<void> {
    await this.click(this.continueButton);
  }

  async getFieldError(field: ShippingField): Promise<string | null> {
    if (!(await this.error(field).isExisting())) return null;
    return this.textOf(this.error(field));
  }

  /** The inputs expose no aria-invalid; validity is only signalled by a red (border-red-*) or green border class. */
  async isFieldMarkedInvalid(field: ShippingField): Promise<boolean> {
    const classes = (await this.input(field).getAttribute("class")) ?? "";
    return /\bborder-red-\d+/.test(classes);
  }

  async getPreviewTotal(): Promise<number> {
    return parsePrice(await this.textOf(this.previewTotal));
  }
}

export default new CheckoutInfoPage();
