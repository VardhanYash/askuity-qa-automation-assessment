import { logger } from "../utils/logger.ts";

export type PageElement = ReturnType<typeof $>;

// Every interactive element in the app exposes a data-test attribute which is used to locate instead of text or CSS classes
export const byTestId = (id: string): string => `[data-test="${id}"]`;
export const byTestIdPrefix = (prefix: string): string => `[data-test^="${prefix}"]`;

export default abstract class BasePage {
  // This element if found, proves this page has rendered
  protected abstract get root(): PageElement;

  async waitForLoaded(): Promise<void> {
    await this.root.waitForDisplayed({ timeoutMsg: `${this.constructor.name} did not render` });
  }

  async isLoaded(): Promise<boolean> {
    return this.root.isDisplayed();
  }

  protected async click(element: PageElement): Promise<void> {
    await element.waitForDisplayed();
    // Centering keeps the target clear of the fixed header and the "Made with Replit" box
    await element.scrollIntoView({ block: "center" });
    await element.waitForClickable();
    await element.click();
  }

  protected async type(element: PageElement, value: string): Promise<void> {
    await element.waitForDisplayed();
    await element.clearValue();
    if (value !== "") {
      await element.setValue(value);
    }
  }

  protected async textOf(element: PageElement): Promise<string> {
    await element.waitForDisplayed();
    return (await element.getText()).trim();
  }

  protected async selectByValue(element: PageElement, value: string): Promise<void> {
    await element.waitForDisplayed();
    await element.scrollIntoView({ block: "center" });
    await element.selectByAttribute("value", value);
    logger.step(`selected "${value}"`);
  }
}
