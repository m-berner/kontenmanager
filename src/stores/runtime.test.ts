/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useRuntimeStore} from "./runtime";

// Silence logs in tests
vi.mock("@/domains/utils", () => ({
    DomainUtils: {log: vi.fn()}
}));

describe("Runtime Store", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("should have sensible defaults", () => {
        const runtime = useRuntimeStore();

        expect(runtime.activeId).toBe(-1);
        expect(runtime.getCurrentView).toBeDefined();
        expect(runtime.dialogName).toBeUndefined();
        expect(runtime.dialogOk).toBe(true);
        expect(runtime.dialogVisibility).toBe(false);
        expect(runtime.curUsd).toBe(1);
        expect(runtime.curEur).toBe(1);
        expect(runtime.stocksPage).toBe(1);
        expect(runtime.isDownloading).toBe(false);
        expect(runtime.isStockLoading).toBe(false);
        expect(runtime.loadedStocksPages instanceof Set).toBe(true);
    });

    it("setTeleport should configure dialog state", () => {
        const runtime = useRuntimeStore();

        runtime.setTeleport({
            dialogName: "DeleteBookingType",
            dialogOk: false,
            dialogVisibility: true
        });

        expect(runtime.dialogName).toBe("DeleteBookingType");
        expect(runtime.dialogOk).toBe(false);
        expect(runtime.dialogVisibility).toBe(true);
    });

    it("resetTeleport should hide dialog and clear option menu colors", () => {
        const runtime = useRuntimeStore();

        // Prepare state
        runtime.setTeleport({
            dialogName: "AnyDialog",
            dialogOk: false,
            dialogVisibility: true
        });
        runtime.optionMenuColors.set(1, "red");
        runtime.optionMenuColors.set(2, "blue");

        // Sanity before reset
        expect(runtime.dialogVisibility).toBe(true);
        expect(runtime.optionMenuColors.size).toBe(2);

        runtime.resetTeleport();

        expect(runtime.dialogName).toBeUndefined();
        expect(runtime.dialogOk).toBe(true);
        expect(runtime.dialogVisibility).toBe(false);
        expect(runtime.optionMenuColors.size).toBe(0);
    });

    it("resetOptionsMenuColors should clear colors without touching dialog state", () => {
        const runtime = useRuntimeStore();
        runtime.setTeleport({
            dialogName: "StayOpen",
            dialogOk: true,
            dialogVisibility: true
        });
        runtime.optionMenuColors.set(3, "green");

        runtime.resetOptionsMenuColors();

        expect(runtime.optionMenuColors.size).toBe(0);
        // Dialog state unchanged
        expect(runtime.dialogVisibility).toBe(true);
        expect(runtime.dialogName).toBe("StayOpen");
    });

    it("setCurrentView should change view and reset teleport state", () => {
        const runtime = useRuntimeStore();

        // Open a dialog first
        runtime.setTeleport({
            dialogName: "Open",
            dialogOk: true,
            dialogVisibility: true
        });

        // Switch to a different view (HOME already default; use a different one)
        // Use a number cast because ViewTypeSelectionType is a union from configs
        const someOtherView = 999 as any;
        runtime.setCurrentView(someOtherView);

        expect(runtime.getCurrentView).toBe(someOtherView);
        // Teleport should have been reset
        expect(runtime.dialogVisibility).toBe(false);
        expect(runtime.dialogName).toBeUndefined();
        expect(runtime.dialogOk).toBe(true);
    });

    it("clearStocksPages should empty the loaded set", () => {
        const runtime = useRuntimeStore();

        runtime.loadedStocksPages.add(1);
        runtime.loadedStocksPages.add(2);
        expect(runtime.loadedStocksPages.size).toBe(2);

        runtime.clearStocksPages();
        expect(runtime.loadedStocksPages.size).toBe(0);
    });

    it("exposed refs should be mutable for consumers (currency, flags)", () => {
        const runtime = useRuntimeStore();
        runtime.curUsd = 1.1;
        runtime.curEur = 0.95;
        runtime.isDownloading = true;
        runtime.isStockLoading = true;

        expect(runtime.curUsd).toBe(1.1);
        expect(runtime.curEur).toBe(0.95);
        expect(runtime.isDownloading).toBe(true);
        expect(runtime.isStockLoading).toBe(true);
    });
});
