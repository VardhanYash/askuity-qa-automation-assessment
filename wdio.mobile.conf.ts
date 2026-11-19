import { config as baseConfig, chromeCapability } from "./wdio.conf.ts";

const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ["src/specs/mobile/**/*.spec.ts"],
  capabilities: [
    chromeCapability("430,932", {
      mobileEmulation: {
        deviceMetrics: { width: 390, height: 844, pixelRatio: 3, touch: true },
        userAgent: MOBILE_USER_AGENT,
      },
    }),
  ],
};
