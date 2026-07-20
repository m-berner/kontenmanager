import {expect, test} from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import {ADDON_ID, startStaticServer, stubBrowser} from "./support/harness";

async function getStorageValue(page: import("@playwright/test").Page, key: string): Promise<unknown> {
    const stored = await page.evaluate((k) => (window as unknown as {
        browser: {storage: {local: {get: (_k?: unknown) => Promise<Record<string, unknown>>}}}
    }).browser.storage.local.get(k), key);
    return stored[key];
}

test.describe("Options page (firefox)", () => {
    test.beforeEach(async () => {
        const buildDir = path.join(process.cwd(), ADDON_ID);
        const manifestPath = path.join(buildDir, "manifest.json");
        await expect(async () => fs.access(manifestPath)).resolves.toBeUndefined();
    });

    test("themeSelector: changes the active skin and persists it to storage", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await page.addInitScript(stubBrowser);
            await page.goto(`${server.baseUrl}/adapters/ui/entrypoints/options.html`, {waitUntil: "load"});

            const darkRadio = page.locator('input[type="radio"][value="dark"]');
            await expect(darkRadio).toBeVisible({timeout: 15_000});
            await darkRadio.click({force: true});

            await expect.poll(() => getStorageValue(page, "sSkin"), {timeout: 10_000}).toBe("dark");
        } finally {
            await server.close();
        }
    });

    test("serviceSelector: changes the market data provider and persists it to storage", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await page.addInitScript(stubBrowser);
            await page.goto(`${server.baseUrl}/adapters/ui/entrypoints/options.html`, {waitUntil: "load"});

            const goyaxRadio = page.locator('input[type="radio"][value="goyax"]');
            await expect(goyaxRadio).toBeVisible({timeout: 15_000});
            await goyaxRadio.click({force: true});

            await expect.poll(() => getStorageValue(page, "sService"), {timeout: 10_000}).toBe("goyax");
        } finally {
            await server.close();
        }
    });

    test("marketPreferences: adds and removes a stock exchange entry", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await page.addInitScript(stubBrowser);
            await page.goto(`${server.baseUrl}/adapters/ui/entrypoints/options.html`, {waitUntil: "load"});

            // Tab index 1 = "Stock exchanges" / "Marktplätze" (DynamicList, MARKETS type).
            // Unlike the EXCHANGES type, MARKETS doesn't trigger a real network fetch on add.
            await page.locator(".v-tab").nth(1).click();

            const uniqueMarket = `TESTMKT${Date.now()}`;
            const input = page.getByRole("textbox", {name: /(New stock exchange|Neuer Marktplatz)/i});
            await expect(input).toBeVisible({timeout: 10_000});
            await input.fill(uniqueMarket);
            await page.locator(".v-card-actions button:visible").click();

            await expect(page.getByText(uniqueMarket)).toBeVisible({timeout: 10_000});
            await expect.poll(() => getStorageValue(page, "sMarkets"), {timeout: 10_000})
                .toEqual(expect.arrayContaining([uniqueMarket]));

            // Remove it again via the list item's prepend ($close) button.
            const listItem = page.locator(".v-list-item", {hasText: uniqueMarket});
            await listItem.locator("button").click();

            await expect(page.getByText(uniqueMarket)).toHaveCount(0);
            await expect.poll(async () => {
                const stored = await getStorageValue(page, "sMarkets") as string[] | undefined;
                return stored?.includes(uniqueMarket) ?? false;
            }, {timeout: 10_000}).toBe(false);
        } finally {
            await server.close();
        }
    });

    test("marketPreferences: toggles an index's visibility checkbox and persists it", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await page.addInitScript(stubBrowser);
            await page.goto(`${server.baseUrl}/adapters/ui/entrypoints/options.html`, {waitUntil: "load"});

            // Tab index 2 = "Indexes" (CheckboxGrid, INDEXES type).
            await page.locator(".v-tab").nth(2).click();

            const daxCheckbox = page.getByRole("checkbox", {name: "DAX"});
            await expect(daxCheckbox).toBeVisible({timeout: 10_000});
            await daxCheckbox.click();

            await expect.poll(() => getStorageValue(page, "sIndexes"), {timeout: 10_000})
                .toEqual(expect.arrayContaining(["dax"]));
        } finally {
            await server.close();
        }
    });
});
