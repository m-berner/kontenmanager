import {expect, test} from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import {
    ADDON_ID,
    bootWithFixtureImported,
    closeAllAlerts,
    readStore,
    startStaticServer,
    waitForDialogsClosed
} from "./support/harness";

interface AccountRow {
    cID: number;
    cSwift: string;
    cIban: string;
}

interface BookingTypeRow {
    cID: number;
    cName: string;
}

interface BookingRow {
    cID: number;
    cDescription: string;
}

test.describe("HeaderBar dialog actions (firefox)", () => {
    test.beforeEach(async () => {
        const buildDir = path.join(process.cwd(), ADDON_ID);
        const manifestPath = path.join(buildDir, "manifest.json");
        await expect(async () => fs.access(manifestPath)).resolves.toBeUndefined();
    });

    test("addAccount: creates a new account and switches to it", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            await page.locator("#addAccount").click({force: true});
            const dialog = page.locator(".v-dialog").last();
            const textboxes = dialog.getByRole("textbox");
            await expect(textboxes.first()).toBeVisible({timeout: 10_000});
            await textboxes.nth(0).fill("NEWACCT1"); // SWIFT
            await textboxes.nth(1).fill("DE11111111111111111111"); // IBAN

            await dialog.locator(".v-card-actions button").first().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const accounts = await readStore<AccountRow>(page, "accounts");
            expect(accounts.some((a) => a.cIban === "DE11111111111111111111")).toBe(true);
        } finally {
            await server.close();
        }
    });

    test("updateAccount: edits the active account's SWIFT code", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            await page.locator("#updateAccount").click({force: true});
            const dialog = page.locator(".v-dialog").last();
            const swiftField = dialog.getByRole("textbox").first();
            await expect(swiftField).toBeVisible({timeout: 10_000});
            await swiftField.fill("UPDATED1");

            await dialog.locator(".v-card-actions button").first().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const accounts = await readStore<AccountRow>(page, "accounts");
            expect(accounts.find((a) => a.cID === 1)?.cSwift).toBe("UPDATED1");
        } finally {
            await server.close();
        }
    });

    test("deleteAccountConfirmation: removes the active account", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            await page.locator("#deleteAccountConfirmation").click({force: true});
            const dialog = page.locator(".v-dialog").last();
            await expect(dialog).toBeVisible({timeout: 10_000});
            await dialog.locator(".v-card-actions button").first().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const accounts = await readStore<AccountRow>(page, "accounts");
            expect(accounts.find((a) => a.cID === 1)).toBeUndefined();
        } finally {
            await server.close();
        }
    });

    test("addBookingType: creates a new booking type", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            await page.locator("#addBookingType").click({force: true});
            const dialog = page.locator(".v-dialog").last();
            const nameField = dialog.getByRole("textbox").first();
            await expect(nameField).toBeVisible({timeout: 10_000});
            // The name field is autofocused on mount (BookingTypeForm's `mode==='add'`
            // branch); an explicit click + settle avoids a race between that autofocus
            // and `.fill()` where the typed value doesn't stick.
            await nameField.click();
            await page.waitForTimeout(200);
            const uniqueName = `E2EType${Date.now()}`;
            await nameField.fill(uniqueName);
            await expect(nameField).toHaveValue(uniqueName);

            await dialog.locator(".v-card-actions button").first().click();

            // Like AddBooking, AddBookingType intentionally stays open after a
            // successful save (addBookingTypeUsecase never calls resetTeleport()) to
            // allow adding several types in a row. Wait for the new row instead of a
            // dialog close, then dismiss the dialog ourselves via Cancel.
            await expect
                .poll(async () => (await readStore<BookingTypeRow>(page, "bookingTypes")).some((bt) => bt.cName === uniqueName), {timeout: 10_000})
                .toBe(true);

            await dialog.locator(".v-card-actions button").last().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const bookingTypes = await readStore<BookingTypeRow>(page, "bookingTypes");
            expect(bookingTypes.some((bt) => bt.cName === uniqueName)).toBe(true);
        } finally {
            await server.close();
        }
    });

    test("updateBookingType: renames the existing booking type", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            await page.locator("#updateBookingType").click({force: true});
            const dialog = page.locator(".v-dialog").last();
            await expect(dialog).toBeVisible({timeout: 10_000});

            // Select the fixture's "BUY" booking type from the dropdown.
            await dialog.locator(".v-select").first().click();
            await page.getByRole("option", {name: "BUY"}).click();

            const newName = `RENAMED${Date.now()}`;
            const nameField = dialog.getByRole("textbox").last();
            await nameField.fill(newName);

            await dialog.locator(".v-card-actions button").first().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const bookingTypes = await readStore<BookingTypeRow>(page, "bookingTypes");
            expect(bookingTypes.find((bt) => bt.cID === 1)?.cName).toBe(newName);
        } finally {
            await server.close();
        }
    });

    test("deleteBookingType: creates then deletes a fresh, unreferenced booking type", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            // Create one first so we have a type with no bookings referencing it
            // (the fixture's only type, "BUY", is referenced and can't be deleted).
            await page.locator("#addBookingType").click({force: true});
            let dialog = page.locator(".v-dialog").last();
            const nameField = dialog.getByRole("textbox").first();
            await expect(nameField).toBeVisible({timeout: 10_000});
            // See the `addBookingType` test above: autofocus settle, and the dialog
            // intentionally stays open after a successful add.
            await nameField.click();
            await page.waitForTimeout(200);
            const uniqueName = `E2EDeletable${Date.now()}`;
            await nameField.fill(uniqueName);
            await expect(nameField).toHaveValue(uniqueName);
            await dialog.locator(".v-card-actions button").first().click();

            await expect
                .poll(async () => (await readStore<BookingTypeRow>(page, "bookingTypes")).some((bt) => bt.cName === uniqueName), {timeout: 10_000})
                .toBe(true);

            await dialog.locator(".v-card-actions button").last().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const beforeDelete = await readStore<BookingTypeRow>(page, "bookingTypes");
            expect(beforeDelete.some((bt) => bt.cName === uniqueName)).toBe(true);

            await page.locator("#deleteBookingType").click({force: true});
            dialog = page.locator(".v-dialog").last();
            await expect(dialog).toBeVisible({timeout: 10_000});
            await dialog.locator(".v-select").first().click();
            await page.getByRole("option", {name: uniqueName}).click();
            await dialog.locator(".v-card-actions button").first().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const afterDelete = await readStore<BookingTypeRow>(page, "bookingTypes");
            expect(afterDelete.some((bt) => bt.cName === uniqueName)).toBe(false);
        } finally {
            await server.close();
        }
    });

    test("addBooking: creates a new booking against the fixture's BUY type and AAPL stock", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            await page.locator("#addBooking").click({force: true});
            const dialog = page.locator(".v-dialog").last();
            await expect(dialog).toBeVisible({timeout: 10_000});

            // Date field (type=date input).
            await dialog.locator('input[type="date"]').first().fill("2021-05-05");

            // Booking type select -> "BUY" (the fixture's only type). Selecting a
            // stock-related type (BUY) reactively inserts the Company select earlier
            // in the DOM (it's declared before the booking-type select in the
            // template), so positional `.v-select` indices shift — target both by
            // their visible label instead.
            await dialog.locator(".v-select").filter({hasText: /(Booking type|Buchungstyp)/}).click();
            await page.getByRole("option", {name: "BUY"}).click();

            await dialog.locator(".v-select").filter({hasText: /(Company|Unternehmen)/}).click();
            await page.getByRole("option", {name: /Apple/i}).click();

            // First fieldset ("booking" credit/debit) — fill debit with a positive amount.
            const bookingFieldset = dialog.locator("fieldset").first();
            await bookingFieldset.getByRole("textbox").nth(1).fill("42");

            const before = await readStore<BookingRow>(page, "bookings");

            await dialog.locator(".v-card-actions button").first().click();

            // Unlike the other Add dialogs, AddBooking intentionally stays open after
            // a successful save (addBookingUsecase never calls resetTeleport()), so
            // multiple bookings can be entered in a row. Wait for the new row instead
            // of a dialog close, then dismiss the dialog ourselves via Cancel.
            await expect
                .poll(async () => (await readStore<BookingRow>(page, "bookings")).length, {timeout: 10_000})
                .toBeGreaterThan(before.length);

            await dialog.locator(".v-card-actions button").last().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const bookings = await readStore<BookingRow>(page, "bookings");
            expect(bookings.length).toBeGreaterThan(before.length);
        } finally {
            await server.close();
        }
    });

    test("exportDatabase: triggers a download with the current data", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            await page.locator("#exportDatabase").click({force: true});
            const dialog = page.locator(".v-dialog").last();
            await expect(dialog).toBeVisible({timeout: 10_000});
            await dialog.locator(".v-card-actions button").first().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const downloadCalls = await page.evaluate(
                () => (window as unknown as {
                    __downloadCalls: Array<{ url: string; filename: string }>
                }).__downloadCalls
            );
            expect(downloadCalls.length).toBeGreaterThan(0);
            expect(downloadCalls[0].filename).toMatch(/\.json$/i);
        } finally {
            await server.close();
        }
    });

    test("showAccounting: opens a read-only dialog with accounting figures, then closes", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            await page.locator("#showAccounting").click({force: true});
            const dialog = page.locator(".v-dialog").last();
            await expect(dialog).toBeVisible({timeout: 10_000});
            // Read-only dialog (dialogOk=false): only a close/cancel action is rendered.
            await expect(dialog.getByText("BUY")).toBeVisible({timeout: 10_000});

            await dialog.locator(".v-card-actions button").click();
            await waitForDialogsClosed(page);
        } finally {
            await server.close();
        }
    });

    test("fadeInStock: shows an info alert when there are no passive (faded-out) stocks", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);
            await page.locator("#company").click();
            await closeAllAlerts(page);

            // The fixture's only stock (AAPL) is active, not faded out, so this action
            // takes its guard-clause branch: an info alert instead of opening a dialog.
            await page.locator("#fadeInStock").click({force: true});

            const alertOverlay = page.locator(".v-overlay").filter({has: page.locator(".v-alert")});
            await expect(alertOverlay).toBeVisible({timeout: 10_000});
            await closeAllAlerts(page);

            await expect(page.locator('.v-dialog[role="dialog"]')).toHaveCount(0);
        } finally {
            await server.close();
        }
    });

    test("updateQuote: manual refresh completes without errors when the provider is disabled", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);
            await page.locator("#company").click();
            await closeAllAlerts(page);

            await page.locator("#updateQuote").click({force: true});
            // sService is "none" (set by bootWithFixtureImported), so this should
            // complete quickly without an error alert and without real network calls.
            await page.waitForTimeout(1000);
            await expect(page.locator(".v-overlay").filter({has: page.locator(".v-alert.bg-error, .v-alert[type=error]")}))
                .toHaveCount(0);
        } finally {
            await server.close();
        }
    });

    test("setting: opens the options page", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            await page.locator("#setting").click({force: true});
            await page.waitForTimeout(200);

            const calls = await page.evaluate(
                () => (window as unknown as { __openOptionsPageCalls: number[] }).__openOptionsPageCalls
            );
            expect(calls.length).toBeGreaterThan(0);
        } finally {
            await server.close();
        }
    });

    test("switchAccount: adds a second account and switches back to the original via the TitleBar select", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            // Add a second account. addAccountUsecase makes it active automatically.
            await page.locator("#addAccount").click({force: true});
            const addDialog = page.locator(".v-dialog").last();
            const textboxes = addDialog.getByRole("textbox");
            await expect(textboxes.first()).toBeVisible({timeout: 10_000});
            await textboxes.nth(0).fill("SECOND01");
            await textboxes.nth(1).fill("DE11111111111111111111");
            await addDialog.locator(".v-card-actions button").first().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const accounts = await readStore<AccountRow>(page, "accounts");
            expect(accounts).toHaveLength(2);

            // Switch back to the original (fixture) account via the TitleBar select.
            const accountSelect = page.locator("header.v-app-bar .v-select");
            await accountSelect.click();
            await page.getByRole("option", {name: "DE00000000000000000000"}).click();

            await expect
                .poll(async () => {
                    const stored = await page.evaluate(() => (window as unknown as {
                        browser: {storage: {local: {get: (_k: unknown) => Promise<Record<string, unknown>>}}}
                    }).browser.storage.local.get("sActiveAccountId"));
                    return stored.sActiveAccountId;
                }, {timeout: 10_000})
                .toBe(1);
        } finally {
            await server.close();
        }
    });

    test("updateBooking: edits the existing booking's remark via the row menu", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            const row = page.locator("tr.table-row", {hasText: "BUY AAPL"});
            await row.getByRole("button", {name: /(Open menu|Menü öffnen)/i}).click({force: true});
            await page.locator("#update-booking").click();

            const dialog = page.locator(".v-dialog").last();
            await expect(dialog).toBeVisible({timeout: 10_000});
            const descriptionField = dialog.getByRole("textbox", {name: /(Remark|Bemerkung)/i});
            await expect(descriptionField).toBeVisible({timeout: 10_000});
            const newDescription = `UPDATED${Date.now()}`;
            await descriptionField.fill(newDescription);

            // updateBookingUsecase calls resetTeleport() on success, so the dialog closes on its own.
            await dialog.locator(".v-card-actions button").first().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const bookings = await readStore<BookingRow>(page, "bookings");
            expect(bookings.find((b) => b.cID === 1)?.cDescription).toBe(newDescription);
        } finally {
            await server.close();
        }
    });

    test("deleteBooking: removes the booking via the row menu (no confirmation step)", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            const row = page.locator("tr.table-row", {hasText: "BUY AAPL"});
            await row.getByRole("button", {name: /(Open menu|Menü öffnen)/i}).click({force: true});

            // deleteBooking has no dialog: it deletes immediately and shows an info alert.
            await page.locator("#delete-booking").click();
            await closeAllAlerts(page);

            const bookings = await readStore<BookingRow>(page, "bookings");
            expect(bookings.find((b) => b.cID === 1)).toBeUndefined();
        } finally {
            await server.close();
        }
    });

    test("searchBookings: filters the bookings table in-memory", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            const searchField = page.getByRole("textbox", {name: /(Search|Suchen)/i});
            await expect(searchField).toBeVisible({timeout: 10_000});

            await searchField.fill("NoSuchBookingXYZ");
            await expect(page.locator("tr.table-row", {hasText: "BUY AAPL"})).toHaveCount(0);

            await searchField.fill("AAPL");
            await expect(page.locator("tr.table-row", {hasText: "BUY AAPL"})).toBeVisible();
        } finally {
            await server.close();
        }
    });

    test("updateStock: edits the stock's URL via the row menu", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);
            await page.locator("#company").click();
            await closeAllAlerts(page);
            // CompanyContent's onBeforeMount kicks off an async stock-load cycle that toggles
            // the table's `loading` state; opening the row menu while that's in flight can close
            // it again mid-interaction (see updateQuote's identical wait for the same reason).
            await page.waitForTimeout(1_000);

            const row = page.locator("tr.table-row", {hasText: "US0378331005"});
            await row.getByRole("button", {name: /(Open menu|Menü öffnen)/i}).click({force: true});
            await page.locator("#update-stock").click();

            const dialog = page.locator(".v-dialog").last();
            await expect(dialog).toBeVisible({timeout: 10_000});
            const urlField = dialog.getByRole("textbox", {name: /^URL$/i});
            await expect(urlField).toBeVisible({timeout: 10_000});
            const newUrl = "https://example.com/aapl";
            await urlField.fill(newUrl);

            // updateStockUsecase calls resetTeleport() on success, so the dialog closes on its own.
            await dialog.locator(".v-card-actions button").first().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            const stocks = await readStore<{ cID: number; cURL: string }>(page, "stocks");
            expect(stocks.find((s) => s.cID === 1)?.cURL).toBe(newUrl);
        } finally {
            await server.close();
        }
    });

    test("deleteStock: adds a disposable stock then deletes it via the row menu", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);
            await page.locator("#company").click();
            await closeAllAlerts(page);
            // See updateStock's identical wait: lets CompanyContent's async stock-load cycle
            // settle before any row menu interaction, so it isn't closed mid-click by a re-render.
            await page.waitForTimeout(1_000);

            // The fixture's AAPL stock is referenced by a booking and can't be deleted
            // (checkStockHasBookings guard), so add a fresh, unreferenced stock instead.
            await page.locator("#addStock").click({force: true});
            const addDialog = page.locator(".v-dialog").last();
            await expect(addDialog).toBeVisible({timeout: 10_000});
            const isinField = addDialog.getByRole("textbox", {name: /\bISIN\b/i});
            await expect(isinField).toBeVisible({timeout: 10_000});
            await isinField.fill("DE000BASF111");
            await addDialog.getByRole("textbox", {name: /(Company|Unternehmen)/i}).fill("BASF SE");
            await addDialog.getByRole("textbox", {name: /(Symbol|Kürzel)/i}).fill("BASF");
            await addDialog.locator(".v-card-actions button").first().click();
            await waitForDialogsClosed(page);
            await closeAllAlerts(page);

            let stocks = await readStore<{ cID: number; cISIN: string }>(page, "stocks");
            expect(stocks.some((s) => s.cISIN === "DE000BASF111")).toBe(true);

            const row = page.locator("tr.table-row", {hasText: "DE000BASF111"});
            await row.getByRole("button", {name: /(Open menu|Menü öffnen)/i}).click({force: true});

            // deleteStock has no confirmation dialog: it deletes immediately (no bookings reference it).
            await page.locator("#delete-stock").click();
            await closeAllAlerts(page);

            stocks = await readStore<{ cID: number; cISIN: string }>(page, "stocks");
            expect(stocks.some((s) => s.cISIN === "DE000BASF111")).toBe(false);
        } finally {
            await server.close();
        }
    });

    test("showDividend: opens the read-only dividend dialog for a stock, then closes", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);
            await page.locator("#company").click();
            await closeAllAlerts(page);
            // See updateStock's identical wait: lets CompanyContent's async stock-load cycle
            // settle before any row menu interaction, so it isn't closed mid-click by a re-render.
            await page.waitForTimeout(1_000);

            const row = page.locator("tr.table-row", {hasText: "US0378331005"});
            await row.getByRole("button", {name: /(Open menu|Menü öffnen)/i}).click({force: true});
            await page.locator("#show-dividend").click();

            const dialog = page.locator(".v-dialog").last();
            await expect(dialog).toBeVisible({timeout: 10_000});
            // The fixture's only booking is a "BUY", not a dividend, so the table is empty.
            await expect(dialog.getByText(/(No dividends received yet|Bisher keine Dividende erhalten)/i))
                .toBeVisible({timeout: 10_000});

            await dialog.locator(".v-card-actions button").click();
            await waitForDialogsClosed(page);
        } finally {
            await server.close();
        }
    });

    test("portfolioDepotSum: shows the depot chip with a value on the Company view", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);
            await page.locator("#company").click();
            await closeAllAlerts(page);

            // The depot chip appears after a 180ms debounce once stock loading settles.
            const depotChip = page.locator("header.v-app-bar .v-chip", {hasText: /(Depot account|Depotkonto)/i});
            await expect(depotChip).toBeVisible({timeout: 10_000});
            await expect(depotChip).toContainText(/\d/);
        } finally {
            await server.close();
        }
    });

    test("keyboardShortcut: Ctrl+Alt+R resets browser.storage.local without touching IndexedDB data", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);
            await page.locator("#home").click();
            await closeAllAlerts(page);

            await page.keyboard.press("Control+Alt+r");

            await expect
                .poll(async () => {
                    const stored = await page.evaluate(() => (window as unknown as {
                        browser: {storage: {local: {get: (_k?: unknown) => Promise<Record<string, unknown>>}}}
                    }).browser.storage.local.get());
                    return stored.sActiveAccountId;
                }, {timeout: 10_000})
                .toBe(-1);

            const stored = await page.evaluate(() => (window as unknown as {
                browser: {storage: {local: {get: (_k?: unknown) => Promise<Record<string, unknown>>}}}
            }).browser.storage.local.get());
            expect(stored.sSkin).toBe("ocean");
            expect(stored.sService).toBe("wstreet");
            expect(stored.sBookingsPerPage).toBe(9);

            // The keyboard shortcut clears browser.storage.local only; IndexedDB data is untouched.
            const accounts = await readStore<AccountRow>(page, "accounts");
            expect(accounts).toHaveLength(1);
        } finally {
            await server.close();
        }
    });

    test("footerNavigation: opens Help and Privacy pages via the FooterBar", async ({page}) => {
        const repoRoot = process.cwd();
        const server = await startStaticServer(path.join(repoRoot, ADDON_ID));
        try {
            await bootWithFixtureImported(page, repoRoot, server.baseUrl);

            const footerNav = page.locator(".v-bottom-navigation");
            await footerNav.getByText(/^(Help|Hilfe)$/i).click();
            await expect(page).toHaveURL(/#\/help$/);
            await expect(page.getByRole("textbox", {name: /(Search|Suchen)/i})).toHaveCount(0);

            await footerNav.getByText(/^(Privacy|Datenschutz)$/i).click();
            await expect(page).toHaveURL(/#\/privacy$/);
        } finally {
            await server.close();
        }
    });
});
