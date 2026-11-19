import type { PageElement } from "../pages/base.page.ts";

type AnyElement = PageElement | WebdriverIO.Element;

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

async function rectOf(element: AnyElement): Promise<Rect> {
  const resolved = (await element) as WebdriverIO.Element;
  await resolved.waitForDisplayed();
  return browser.execute((el) => {
    const r = (el as unknown as Element).getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
  }, resolved);
}

export async function getViewportWidth(): Promise<number> {
  return browser.execute(() => window.innerWidth);
}

// True when the page can be scrolled sideways
export async function hasHorizontalOverflow(): Promise<boolean> {
  return browser.execute(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

// True when the element lies horizontally inside the viewport
export async function fitsViewportWidth(element: AnyElement): Promise<boolean> {
  const [rect, viewportWidth] = await Promise.all([rectOf(element), getViewportWidth()]);
  return rect.left >= -1 && rect.right <= viewportWidth + 1;
}

// True when `lower` starts at or below the bottom edge of `upper`
export async function isStackedBelow(lower: AnyElement, upper: AnyElement): Promise<boolean> {
  const [lowerRect, upperRect] = await Promise.all([rectOf(lower), rectOf(upper)]);
  return lowerRect.top >= upperRect.bottom - 1;
}
