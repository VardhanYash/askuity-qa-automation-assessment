export interface User {
  username: string;
  password: string;
  // Label shown on the login page's Practice accounts card
  role: string;
}

// All practice accounts share one password and can override via TEST_PASSWORD if it ever rotates. 
export const PASSWORD = process.env.TEST_PASSWORD ?? "test_sauce";

export const USERS = {
  shopper: { username: "fern_signal", password: PASSWORD, role: "Shopper" },
  locked: { username: "quiet_lock", password: PASSWORD, role: "Locked account" },
  imageVariation: { username: "lens_warp", password: PASSWORD, role: "Image variation" },
  cartBadge: { username: "count_echo", password: PASSWORD, role: "Cart badge" },
} satisfies Record<string, User>;

/** Users that are expected to reach the inventory page. */
export const ACCEPTED_USERS: User[] = [USERS.shopper, USERS.imageVariation, USERS.cartBadge];

export const LOGIN_ERRORS = {
  lockedOut: "Sorry, this user has been locked out.",
  invalidCredentials: "Username and password do not match any user in this service",
  usernameRequired: "Username is required",
  passwordRequired: "Password is required",
};
