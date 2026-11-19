// Polls read until two consecutive reads return the same value, then returns it
// Used after filter/sort/quantity changes so assertions run against a settled DOM, not mid-render
export async function waitForStable<T>(read: () => Promise<T>, description: string, timeout = 5000): Promise<T> {
  let previous: string | undefined;
  let latest: T | undefined;
  await browser.waitUntil(
    async () => {
      latest = await read();
      const snapshot = JSON.stringify(latest);
      const stable = snapshot === previous;
      previous = snapshot;
      return stable;
    },
    { timeout, interval: 250, timeoutMsg: `"${description}" did not settle within ${timeout}ms` },
  );
  return latest as T;
}
