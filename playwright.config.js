import {defineConfig} from "@playwright/test";

// Headed runs open a real, visible browser window per worker. On a single
// display, multiple simultaneous windows compete for OS foreground focus;
// the OS throttles input/rendering on the ones in the background, so Playwright's
// simulated clicks silently never land until the test times out. Headless
// runs have no such window to occlude, so only headed needs to be serialized.
const isHeaded = process.argv.includes("--headed");

export default defineConfig({
  fullyParallel: !isHeaded,
  workers: isHeaded ? 1 : undefined,
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: {timeout: 10_000},
  // Serializing workers (above) fixes the multi-window focus contention, but
  // even a single headed window can occasionally lack real OS foreground
  // focus on this machine (e.g. the terminal/IDE briefly holds it instead),
  // causing a synthetic click to silently never land. Headless has no window
  // to lose focus, so it stays strict at 0 retries.
  retries: isHeaded ? 1 : 0,
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
