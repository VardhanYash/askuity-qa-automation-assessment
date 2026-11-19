# Bug Report Morrow Supply QA Assessment

**Environment (all tickets unless stated):** https://qa-task--oyettijon.replit.app · Chrome 157.0.8103.52 · Windows 11 · desktop 1440×900 · found 2026-11-19
**Password for all practice accounts:** `test_sauce`

Each ticket links to the automated test that reproduces it (tagged `@knownBug`, run them all with `npm run test:bugs`).

| ID | Title | Severity | Priority |
| --- | --- | --- | --- |
| BUG-001 | "Price: High to Low" sorts items from low to high | High | P1 |
| BUG-002 | "Bolt T-Shirt" cannot be added to the cart | High | P1 |
| BUG-005 | Cart is not emptied after an order is placed | High | P1 |
| BUG-004 | Empty First Name at checkout shows "Last Name is required" and is styled as valid | Medium | P2 |
| BUG-006 | `lens_warp` user sees every product with another product's image | Medium | P2 |
| BUG-008 | `count_echo` user's cart badge is always one higher than the cart quantity | Medium | P2 |
| BUG-003 | Login with a missing password shows "Username is required" | Low | P3 |
| BUG-007 | Item count label reads "1 items to explore" | Low | P4 |
| BUG-009 | Refreshing the page or opening a URL directly logs the user out and empties the cart | Medium | P3 |

---

## BUG-001: "Price: High to Low" sorts items from low to high

**Severity:** High · **Priority:** P1 · **Component:** Products page, sort
**Automated test:** `02-products.spec.ts` -> TC-PROD-05 sorting by "Price: High to Low"

**Steps to reproduce**
1. Log in as `fern_signal`.
2. In the sort dropdown, select **Price: High to Low**.

**Expected:** Items ordered by price descending: Summit Fleece $49.99, After Hours Hoodie $44.99, Trailmark Day Pack $29.99 … Branch Point Decals $4.99.
**Actual:** Items are ordered ascending, identical to "Price: Low to High": Branch Point Decals $4.99, Little Trek Bodysuit $7.99 … Summit Fleece $49.99.

**Notes:** The other three sort options work correctly.

---

## BUG-002: "Bolt T-Shirt" cannot be added to the cart

**Severity:** High · **Priority:** P1 · **Component:** Products page, Add to Cart
**Automated test:** `03-cart.spec.ts` -> TC-CART-08 "Bolt T-Shirt" can be added to the cart

**Steps to reproduce**
1. Log in as `fern_signal` (also reproduced with `lens_warp` and `count_echo`).
2. Click **Add to Cart** on the **Bolt T-Shirt** card.
3. Click **Cart**.

**Expected:** Button changes to "Added!", cart badge shows 1, cart contains Bolt T-Shirt ×1.
**Actual:** Nothing happens: the button stays "Add to Cart", no badge appears, and the cart is empty. All 11 other products add correctly. It reproduces whether Bolt T-Shirt is the first or a later item added, and also with `element.click()`, so it is not a timing or overlay issue.

**Impact:** The product cannot be purchased at all.

---

## BUG-003: Login with a missing password shows "Username is required"

**Severity:** Low · **Priority:** P3 · **Component:** Login
**Automated test:** `01-login.spec.ts` -> TC-LOGIN-06

**Steps to reproduce**
1. Open /login.
2. Enter username `fern_signal`, leave the password empty.
3. Click **Login**.

**Expected:** "Epic sadface below — Password is required".
**Actual:** "Epic sadface below — Username is required", even though the username is filled in.

---

## BUG-004: Empty First Name at checkout shows "Last Name is required" and is styled as valid

**Severity:** Medium · **Priority:** P2 · **Component:** Checkout, shipping information form
**Automated test:** `04-checkout.spec.ts` -> TC-CHK-02

**Steps to reproduce**
1. Log in as `fern_signal`, add any item, open Cart, click **Proceed to Checkout**.
2. Leave all fields empty and click **Continue**.

**Expected:** Under First Name: "First Name is required", with the field highlighted red like the others.
**Actual:**
- The message under **First Name** reads **"Last Name is required"**.
- The empty First Name field is highlighted **green** (`border-green-400 bg-green-50`), i.e. shown as valid, while the empty Last Name and Postal Code fields are red.

**Notes:** The form still correctly blocks submission. None of the fields set `aria-invalid`, so screen-reader users get no validity state either (accessibility follow-up).

---

## BUG-005: Cart is not emptied after an order is placed

**Severity:** High · **Priority:** P1 · **Component:** Checkout, completion
**Automated test:** `04-checkout.spec.ts` -> TC-CHK-04

**Steps to reproduce**
1. Log in as `fern_signal`, add Trailmark Day Pack, open Cart, Proceed to Checkout.
2. Fill First Name / Last Name / Postal Code, click **Continue**, then **Finish**.
3. On the "Order Placed!" page, look at the cart badge, then click **Cart** in the header.

**Expected:** The order has been placed, so the badge disappears and the cart is empty.
**Actual:** The badge still shows the old count and the cart still contains the ordered items. The cart is only cleared when the user clicks the **Continue Shopping** button on the confirmation page. A user who navigates away any other way can check out the same items again (duplicate orders).

---

## BUG-006: `lens_warp` user sees every product with another product's image

**Severity:** Medium · **Priority:** P2 · **Component:** Products page, product images (user-specific)
**Automated test:** `05-user-variations.spec.ts` -> TC-VAR-01

**Steps to reproduce**
1. Log in as `fern_signal` and note the product images.
2. Log out, log in as `lens_warp`.

**Expected:** Each product shows its own image, identical to the standard user.
**Actual:** All 12 images are shuffled:

| Product | Shows the image of |
| --- | --- |
| After Hours Hoodie | Daybreak Ceramic Mug |
| Bolt T-Shirt | Nightline Safety Light |
| Branch Point Decals | Gridline Journal |
| Bug Hunt Crew Socks | Signal Path Field Guide |
| Daybreak Ceramic Mug | Side Quest Tee |
| Gridline Journal | After Hours Hoodie |
| Little Trek Bodysuit | Summit Fleece |
| Nightline Safety Light | Trailmark Day Pack |
| Side Quest Tee | Little Trek Bodysuit |
| Signal Path Field Guide | Branch Point Decals |
| Summit Fleece | Bolt T-Shirt |
| Trailmark Day Pack | Bug Hunt Crew Socks |

**Impact:** Customers see the wrong product picture next to name and price.

---

## BUG-007: Item count label reads "1 items to explore"

**Severity:** Low · **Priority:** P4 · **Component:** Products page, copy
**Automated test:** `02-products.spec.ts` -> TC-PROD-04

**Steps to reproduce:** Log in as `fern_signal`, filter by **Books** (or search "mug").
**Expected:** "1 item to explore".
**Actual:** "1 items to explore". (The cart title pluralises correctly: "Your Cart (1 item)".)

---

## BUG-008: `count_echo` user's cart badge is always one higher than the cart quantity

**Severity:** Medium · **Priority:** P2 · **Component:** Header, cart badge (user-specific)
**Automated test:** `05-user-variations.spec.ts` -> TC-VAR-02

**Steps to reproduce**
1. Log in as `count_echo`.
2. Add After Hours Hoodie and Trailmark Day Pack.
3. Click **Cart**.

**Expected:** Badge = 2, matching "Your Cart (2 items)".
**Actual:** Badge = 3. The badge reads one more than the real quantity from the first add onwards (1 item -> badge 2; 11 items -> badge 12).

---

## BUG-009: Refreshing the page or opening a URL directly logs the user out and empties the cart

**Severity:** Medium · **Priority:** P3 · **Component:** Session / state persistence
**Automated test:** none. The suite depends on this behaviour for isolation (every test starts with a fresh page load), so it is documented here instead.

**Steps to reproduce**
1. Log in as `fern_signal`, add any item (badge shows 1).
2. Press **F5** (or paste a product URL such as https://qa-task--oyettijon.replit.app/product/bolt-t-shirt into the address bar).

**Expected:** The user stays logged in on the same page with the cart intact (or, if deliberate for the demo, this is documented).
**Actual:** Redirected to /login; after logging in again the cart is empty. Session and cart are held only in memory (nothing in cookies, localStorage or sessionStorage). Product deep links (/product/…) cannot be shared or bookmarked.
