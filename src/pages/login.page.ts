import BasePage, { byTestId } from "./base.page.ts";
import { logger } from "../utils/logger.ts";

class LoginPage extends BasePage {
  protected get root() {
    return $(byTestId("login-page"));
  }

  get usernameInput() {
    return $(byTestId("username"));
  }

  get passwordInput() {
    return $(byTestId("password"));
  }

  get loginButton() {
    return $(byTestId("login-button"));
  }

  get errorMessage() {
    return $(byTestId("login-error-message"));
  }

  practiceAccountButton(username: string) {
    return $(byTestId(`hint-user-${username}`));
  }

  // The app keeps its session and cart in memory, so a full page load of /login guarantees each test starts logged out
  async open(): Promise<void> {
    await browser.url("/login");
    await this.waitForLoaded();
  }

  async login(username: string, password: string): Promise<void> {
    logger.step(`log in as "${username}"`);
    await this.type(this.usernameInput, username);
    await this.type(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async usePracticeAccount(username: string): Promise<void> {
    await this.click(this.practiceAccountButton(username));
  }

  /** Strips the decorative "Epic sadface below —" prefix so assertions target the actual message. */
  async getErrorMessage(): Promise<string> {
    const text = await this.textOf(this.errorMessage);
    return text.replace(/^.*?—\s*/, "");
  }
}

export default new LoginPage();
