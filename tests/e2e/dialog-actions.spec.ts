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
});
