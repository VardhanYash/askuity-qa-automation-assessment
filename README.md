# Morrow Supply Shopping Cart Automation (WebdriverIO + TypeScript)

End-to-end tests for the Askuity QA automation exercise: login, product filtering and sorting, cart quantity management, pricing/tax validation, checkout, and a mobile-responsive suite.

- Application under test: https://qa-task--oyettijon.replit.app
- Stack: WebdriverIO 9, TypeScript, Mocha, Chrome (desktop + mobile emulation)
- Bugs found: see [BUGS.md](./BUGS.md)

## 1. Setup

Prerequisites: [Node.js](https://nodejs.org/) 20+ and Google Chrome.

```bash
npm install
```

WebdriverIO downloads a matching ChromeDriver automatically on first run.

## 2. Running the tests

| Command | What it runs |
| --- | --- |
| `npm test` | Green path: `test:stable` then `test:mobile` |
| `npm run test:desktop` | All desktop specs (`src/specs/desktop`), including the `@knownBug` tests, which fail |
| `npm run test:stable` | Desktop specs excluding tests tagged `@knownBug` (should be fully green) |
| `npm run test:bugs` | Only the `@knownBug` tests (each one reproduces a ticket in BUGS.md and is expected to fail) |
| `npm run test:mobile` | Mobile-responsive specs (`src/specs/mobile`) in a 390x844 emulated phone |
| `npm run typecheck` | TypeScript compile check |

Run a single spec: `npx wdio run ./wdio.conf.ts --spec src/specs/desktop/03-cart.spec.ts`

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `HEADLESS` | `false` | `true` runs Chrome headless (CI) |
| `BASE_URL` | `https://qa-task--oyettijon.replit.app` | Point the suite at another environment |
| `MAX_INSTANCES` | `4` | Number of spec files run in parallel |
| `BROWSER_VERSION` | installed Chrome | Pin Chrome/driver version if they disagree (see Troubleshooting) |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn` or `error` for the framework logger |
| `TEST_PASSWORD` | `test_sauce` | Shared practice-account password |

PowerShell:

```powershell
$env:HEADLESS="true"; npm test
```

bash:

```bash
HEADLESS=true npm test
```

### Known-bug tests

Tests that reproduce a defect are tagged in their title with `@knownBug BUG-00X`. They assert the correct behaviour, so they fail today and will start passing once the bug is fixed. That is why `npm run test:desktop` reports 8 failures. `npm test` and `npm run test:stable` show the suite is otherwise green.

### Reports

- Console: WebdriverIO spec reporter, plus timestamped framework logs (`[INFO] START ...`, `PASS ...`, `FAIL ...`).
- `reports/screenshots/`: a screenshot is captured automatically for every failed test.
- `reports/wdio-logs/`: raw WebdriverIO/driver logs per worker.

## 3. Framework design

```
src/
├── data/                 Test data: users, product catalogue, shipping info, expected messages
├── pages/                Page Object Model
│   ├── base.page.ts      Shared waits, safe click/type, select helpers, data-test locator helpers
│   ├── components/
│   │   └── header.component.ts   Header shared by every logged-in page (cart badge, logout)
│   ├── login.page.ts
│   ├── inventory.page.ts
│   ├── cart.page.ts
│   ├── checkout-info.page.ts
│   ├── checkout-summary.page.ts
│   └── checkout-complete.page.ts
├── flows/
│   └── shopping.flow.ts  Reusable multi-page steps (loginAs, addProductsToCart, openCart, goToOrderSummary)
├── utils/
│   ├── price.ts          Price parsing + expected subtotal/tax/total (integer-cents arithmetic)
│   ├── wait.ts           waitForStable: waits until a list/value stops changing after a re-render
│   ├── viewport.ts       Responsive-layout checks (horizontal overflow, fits viewport, stacking)
│   └── logger.ts         Levelled, timestamped logger
└── specs/
    ├── desktop/          01-login, 02-products, 03-cart, 04-checkout, 05-user-variations
    └── mobile/           mobile.spec.ts
wdio.conf.ts              Desktop config (parallel workers, failure screenshots, logging hooks)
wdio.mobile.conf.ts       Extends the desktop config with Chrome mobile emulation
```

### Key decisions

- Page Object Model with component objects. Specs read as user intent (`CartPage.increaseQuantity(name)`) and selectors live only in page objects. The header is a component because every logged-in page shares it.
- Locator strategy. The app exposes `data-test` attributes on every interactive element, so all locators use them through the `byTestId()` helper. Rows are located by product name (for example the cart line whose `cart-item-name` is "Summit Fleece") rather than by index or internal numeric id, so tests survive re-ordering. The one element with no `data-test` (the "N items to explore" label) is anchored on its heading via XPath.
- Test data management. Users, catalogue, categories, sort options, shipping data and expected messages are in `src/data`. Expected values (category counts, sort order, totals) are derived from that data or from what the page displays, never hard-coded inside specs.
- Pricing oracle. `calculateExpectedTotals()` recomputes subtotal, 8% tax and total in integer cents, independently of the app, and is reused by the cart, checkout and mobile tests.
- Waits and resiliency. There are no fixed `pause()` calls. Clicks wait for the element to be displayed and clickable, and scroll it to the centre so it is clear of the floating "Made with Replit" pill. After filter, sort or quantity changes, `waitForStable` polls until the DOM stops changing. Quantity and badge changes wait for the exact expected value.
- Isolation and parallelism. The app keeps session and cart in memory, so every test starts with a full page load of `/login` and a fresh login. That means there is no shared state and no ordering dependency between tests. Spec files run in parallel (`maxInstances`, default 4).
- Exception handling and logging. Waits carry descriptive `timeoutMsg`s, price parsing throws with the offending text, unknown product names throw with a pointer to the data file, and `afterTest` logs PASS/FAIL and saves a screenshot on failure. Screenshot errors are logged, not thrown.

## 4. Test cases

Preconditions for every case unless stated: Chrome, app reachable, fresh page load (logged out, empty cart). Password for all practice accounts is `test_sauce`.

### 4.1 Login (`01-login.spec.ts`)

| ID | Title | Steps | Expected result |
| --- | --- | --- | --- |
| TC-LOGIN-01 | Accepted users can log in (data-driven: `fern_signal`, `lens_warp`, `count_echo`) | 1. Open /login 2. Enter username + password 3. Click Login | Products page is displayed, URL is not /login, header shows the username |
| TC-LOGIN-02 | Locked user cannot log in | Log in as `quiet_lock` | Error "Sorry, this user has been locked out." shown; user stays on /login; products page not shown |
| TC-LOGIN-03 | Wrong password rejected | Log in as `fern_signal` with a wrong password | Error "Username and password do not match any user in this service"; stays on /login |
| TC-LOGIN-04 | Unknown user rejected | Log in as `no_such_user` | Same invalid-credentials error |
| TC-LOGIN-05 | Empty form | Click Login with both fields empty | Error "Username is required" |
| TC-LOGIN-06 | Missing password `@knownBug BUG-003` | Enter a username only, click Login | Error "Password is required" |
| TC-LOGIN-07 | Practice-account shortcut | Click the `count_echo` card under "Practice accounts" | Username field = `count_echo`, password field = `test_sauce` |
| TC-LOGIN-08 | Logout | Log in, click Logout | Login page shown at /login |

### 4.2 Products page (`02-products.spec.ts`, user `fern_signal`)

| ID | Title | Steps | Expected result |
| --- | --- | --- | --- |
| TC-PROD-01 | Total item count | Log in | 12 product cards displayed; "12 items to explore" label matches |
| TC-PROD-02 | Catalogue and prices | Read every card | All 12 catalogue products shown with their correct prices |
| TC-PROD-03 | Filter by each category (data-driven: All, Apparel, Accessories, Gear, Books) | Select the category | Exactly the products of that category are shown (All 12, Apparel 5, Accessories 4, Gear 2, Books 1); count label matches |
| TC-PROD-04 | Count label grammar `@knownBug BUG-007` | Filter by Books | Label reads "1 item to explore" |
| TC-PROD-05 | Sort by each option (data-driven: Name A to Z, Name Z to A, Price Low to High, Price High to Low `@knownBug BUG-001`) | 1. Sort by a different option first 2. Sort by the option under test | All 12 items present, ordered by name (locale compare) or price, in the selected direction |
| TC-PROD-06 | Sort within a filter | Filter Apparel, sort Price Low to High | Only the 5 apparel items, in ascending price |
| TC-PROD-07 | Search | 1. Search "TEE" 2. Search "zzz-no-match" | 1. Bolt T-Shirt, Side Quest Tee (case-insensitive) 2. Empty state shown, 0 items |

### 4.3 Cart (`03-cart.spec.ts`, user `fern_signal`)

Selection used: After Hours Hoodie (top of list), Gridline Journal (middle), Trailmark Day Pack (bottom).

| ID | Title | Steps | Expected result |
| --- | --- | --- | --- |
| TC-CART-01 | Initial cart state | 1. Log in 2. Click Cart 3. Click Continue Shopping | No badge; cart shows "Your cart is empty" + "Head back to the store and add some items.", no Checkout button, no lines; Continue Shopping returns to products |
| TC-CART-02 | Add top, middle and bottom items | 1. Add the three items 2. Click Cart | Badge = 3; cart has exactly those 3 lines, qty 1 each, unit prices match catalogue; title "(3 items)"; subtotal = sum of prices |
| TC-CART-03 | Product-card quantity stepper | On the Hoodie card click (+) twice, then Add to Cart | Badge = 3; cart quantity of Hoodie = 3 |
| TC-CART-04 | Increase / decrease quantity | 1. Add Hoodie + Day Pack 2. In cart: Hoodie (+)(+), Day Pack (+) 3. Hoodie (-) | After step 2: Hoodie 3, Day Pack 2, title "(5 items)", badge 5. After step 3: Hoodie 2, title "(4 items)", badge 4; every line total = unit price x qty; totals correct |
| TC-CART-05 | Remove lines | 1. Add 3 items 2. (-) on Journal at qty 1 3. Remove Day Pack 4. Remove Hoodie | Journal and Day Pack removed, badge 1; after last removal the empty-cart state shows and badge disappears |
| TC-CART-06 | Pricing logic | Add Hoodie x2, Journal, Day Pack; then (+) Day Pack; then (-) Hoodie | After each change: subtotal = sum of (unit price x qty), tax = subtotal x 8% rounded to 2 decimals, total = subtotal + tax |
| TC-CART-07 | Cart persists across navigation | 1. Add Hoodie 2. Open Cart 3. Click Continue Shopping 4. Add Day Pack 5. Open Cart | Both items in cart |
| TC-CART-08 | Every product can be added (data-driven over all 12; Bolt T-Shirt `@knownBug BUG-002`) | Click the product's Add to Cart, open cart | Badge 1; cart contains exactly that product |

### 4.4 Checkout (`04-checkout.spec.ts`, user `fern_signal`, cart: Hoodie x2, Journal, Day Pack)

| ID | Title | Steps | Expected result |
| --- | --- | --- | --- |
| TC-CHK-01 | Full checkout | 1. Proceed to Checkout 2. Fill First "Ada", Last "Lovelace", Postal "M5V 2T6" 3. Continue 4. Finish 5. Continue Shopping | 1. Order preview total = cart total. 3. Order Summary: same lines/qty/prices as cart, "Shipping to: Ada Lovelace — M5V 2T6", subtotal/tax/total match manual calculation and the cart. 4. "Order Placed!" + "Thank you for your purchase. Your order has been successfully submitted." 5. Products page, badge cleared |
| TC-CHK-02 | Required-field validation `@knownBug BUG-004` | Click Continue with all fields empty | Each field shows its own message ("First Name is required", "Last Name is required", "Postal Code is required") and is styled invalid; user stays on the form |
| TC-CHK-03 | Partial form | 1. Fill first + last name, Continue 2. Fill postal code, Continue | 1. Only the postal-code error remains; not navigated 2. Order Summary shown |
| TC-CHK-04 | Cart emptied after order `@knownBug BUG-005` | Complete checkout up to "Order Placed!", then open Cart from the header | Badge 0; cart is empty |

### 4.5 Practice-account variations (`05-user-variations.spec.ts`)

| ID | Title | Steps | Expected result |
| --- | --- | --- | --- |
| TC-VAR-01 | `lens_warp` images `@knownBug BUG-006` | 1. Log in as `fern_signal`, capture each product's image 2. Log in as `lens_warp`, capture again | Every product shows the same image as for the standard shopper |
| TC-VAR-02 | `count_echo` cart badge `@knownBug BUG-008` | Log in as `count_echo`, add 2 items, open cart | Cart title says 2 items; badge = 2 |

### 4.6 Mobile responsive (`mobile/mobile.spec.ts`, Chrome emulation, 390x844, touch, mobile UA)

| ID | Title | Steps | Expected result |
| --- | --- | --- | --- |
| TC-MOB-01 | Login on mobile | Open /login, log in as `fern_signal` | No horizontal scroll; Login button, Cart link and Logout button fully within the viewport |
| TC-MOB-02 | Locked user on mobile | Log in as `quiet_lock` | Error visible and fully within the viewport |
| TC-MOB-03 | Products, filter and sort on mobile | Log in; filter Accessories; sort Price Low to High | No horizontal scroll; 12 items initially; filter and sort controls within viewport; 4 items after filter; prices ascending |
| TC-MOB-04 | Cart on mobile | Add top + bottom item, open cart, (+) on Day Pack | No horizontal scroll; qty 2, badge 3; totals correct; order summary stacks below the item list; Checkout button within viewport |
| TC-MOB-05 | Checkout on mobile | 1. Add 2 items 2. Proceed to Checkout 3. Fill shipping info, Continue 4. Finish | No horizontal scroll on form and summary; summary totals = cart totals; Finish and Continue Shopping buttons within viewport; "Order Placed!" shown |

## 5. Troubleshooting

- `This version of ChromeDriver only supports Chrome version N`: Chrome has downloaded an update but not restarted yet. Restart Chrome, or pin the driver to the installed browser with `BROWSER_VERSION=<version from chrome://version>`.
- Child-element lookups returning "element wasn't found": the config sets `wdio:enforceWebDriverClassic: true` because with WebDriver BiDi on Chrome 156, element-scoped CSS lookups (`parent.$(child)`) found nothing. Keep that capability unless WebdriverIO/Chrome are upgraded and re-verified.
