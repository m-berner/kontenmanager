import {defineConfig} from "@playwright/test";

/**
 * Dedicated config for tests/e2e/happy-path.spec.ts, run in isolation.
 *
 * TitleBar's onMounted connectivity check and the rest of app boot can occasionally
 * exceed happy-path's header-visibility timeout when several Firefox instances launch
 * in parallel (see tests/README.md's debugging notes). Running it alone with a single
 * worker avoids that contention without slowing down or destabilizing the main suite
 * (playwright.config.js excludes this file via testIgnore).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/happy-path.spec.ts"],
  timeout: 120_000,
  expect: {timeout: 10_000},
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  projects: [
    {
      name: "firefox",
      use: {browserName: "firefox"}
    }
  ],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  }
});
