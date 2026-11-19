import { ACCEPTED_USERS, LOGIN_ERRORS, PASSWORD, USERS } from "../../data/users.ts";
import Header from "../../pages/components/header.component.ts";
import InventoryPage from "../../pages/inventory.page.ts";
import LoginPage from "../../pages/login.page.ts";

describe("Login", () => {
  beforeEach(async () => {
    await LoginPage.open();
  });

  for (const user of ACCEPTED_USERS) {
    it(`TC-LOGIN-01 accepted user "${user.username}" (${user.role}) can log in`, async () => {
      await LoginPage.login(user.username, user.password);

      await InventoryPage.waitForLoaded();
      await expect(browser).not.toHaveUrl(expect.stringContaining("/login"));
      expect(await Header.getLoggedInUsername()).toBe(user.username);
    });
  }

  it(`TC-LOGIN-02 locked user "${USERS.locked.username}" cannot log in`, async () => {
    await LoginPage.login(USERS.locked.username, USERS.locked.password);

    expect(await LoginPage.getErrorMessage()).toBe(LOGIN_ERRORS.lockedOut);
    await expect(browser).toHaveUrl(expect.stringContaining("/login"));
    expect(await InventoryPage.isLoaded()).toBe(false);
  });

  it("TC-LOGIN-03 a wrong password is rejected", async () => {
    await LoginPage.login(USERS.shopper.username, "not-the-password");

    expect(await LoginPage.getErrorMessage()).toBe(LOGIN_ERRORS.invalidCredentials);
    await expect(browser).toHaveUrl(expect.stringContaining("/login"));
  });

  it("TC-LOGIN-04 an unknown username is rejected", async () => {
    await LoginPage.login("no_such_user", PASSWORD);

    expect(await LoginPage.getErrorMessage()).toBe(LOGIN_ERRORS.invalidCredentials);
  });

  it("TC-LOGIN-05 an empty form asks for the username", async () => {
    await LoginPage.login("", "");

    expect(await LoginPage.getErrorMessage()).toBe(LOGIN_ERRORS.usernameRequired);
  });

  it("TC-LOGIN-06 a missing password asks for the password @knownBug BUG-003", async () => {
    await LoginPage.login(USERS.shopper.username, "");

    expect(await LoginPage.getErrorMessage()).toBe(LOGIN_ERRORS.passwordRequired);
  });

  it("TC-LOGIN-07 tapping a practice account fills its credentials", async () => {
    await LoginPage.usePracticeAccount(USERS.cartBadge.username);

    await expect(LoginPage.usernameInput).toHaveValue(USERS.cartBadge.username);
    await expect(LoginPage.passwordInput).toHaveValue(PASSWORD);
  });

  it("TC-LOGIN-08 logging out returns to the login page", async () => {
    await LoginPage.login(USERS.shopper.username, USERS.shopper.password);
    await InventoryPage.waitForLoaded();

    await Header.logout();

    await LoginPage.waitForLoaded();
    await expect(browser).toHaveUrl(expect.stringContaining("/login"));
  });
});
