import * as fs from "node:fs";
import * as path from "node:path";
import { logger } from "./src/utils/logger.ts";

export const BASE_URL = process.env.BASE_URL ?? "https://qa-task--oyettijon.replit.app";
const HEADLESS = process.env.HEADLESS === "true";
const SCREENSHOT_DIR = path.resolve("reports", "screenshots");

export function chromeCapability(windowSize: string, chromeOptions: Record<string, unknown> = {}): WebdriverIO.Capabilities {
  return {
    browserName: "chrome",
    // Pin when the installed Chrome and the auto-downloaded driver disagree (e.g. BROWSER_VERSION=156.0.8078.80).
    ...(process.env.BROWSER_VERSION ? { browserVersion: process.env.BROWSER_VERSION } : {}),
    // Under WebDriver BiDi, element-scoped CSS lookups (parent.$(child)) return nothing on Chrome 156;
    // the classic protocol resolves them correctly.
    "wdio:enforceWebDriverClassic": true,
    "goog:chromeOptions": {
      args: [
        `--window-size=${windowSize}`,
        "--disable-search-engine-choice-screen",
        ...(HEADLESS ? ["--headless=new", "--disable-gpu"] : []),
      ],
      ...chromeOptions,
    },
  };
}

export const config: WebdriverIO.Config = {
  runner: "local",
  tsConfigPath: "./tsconfig.json",
  baseUrl: BASE_URL,

  specs: ["src/specs/desktop/**/*.spec.ts"],
  maxInstances: Number(process.env.MAX_INSTANCES ?? 4),

  capabilities: [chromeCapability("1440,900")],

  logLevel: "warn",
  outputDir: path.resolve("reports", "wdio-logs"),
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 120000,
  },

  onPrepare() {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  },

  beforeTest(test) {
    logger.info(`START  ${test.parent} > ${test.title}`);
  },

  async afterTest(test, _context, { passed, error }) {
    if (passed) {
      logger.info(`PASS   ${test.title}`);
      return;
    }
    logger.error(`FAIL   ${test.title}: ${error?.message?.split("\n")[0]}`);
    const fileName = `${test.parent}--${test.title}`.replace(/[^a-z0-9]+/gi, "_").slice(0, 150);
    try {
      await browser.saveScreenshot(path.join(SCREENSHOT_DIR, `${fileName}.png`));
    } catch (screenshotError) {
      logger.warn(`Could not capture failure screenshot: ${(screenshotError as Error).message}`);
    }
  },
};
