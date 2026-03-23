/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {setActiveTestPinia} from "@test/pinia";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";

// Silence logs in tests
vi.mock("@/domain/utils", () => ({
    DomainUtils: {log: vi.fn()}
}));

describe("Runtime Store", () => {
    beforeEach(() => {
        setActiveTestPinia();
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
    });

    it("setTeleport should configure dialog state", () => {
        const runtime = useRuntimeStore();

        runtime.setTeleport({
            dialogName: "deleteBookingType",
            dialogOk: false,
            dialogVisibility: true
        });

        expect(runtime.dialogName).toBe("deleteBookingType");
        expect(runtime.dialogOk).toBe(false);
        expect(runtime.dialogVisibility).toBe(true);
    });

    it("resetTeleport should hide the dialog and clear option menu colors", () => {
        const runtime = useRuntimeStore();

        // Prepare state
        runtime.setTeleport({
            dialogName: "addAccount",
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

    it("resetOptionsMenuColors should clear colors without touching the dialog state", () => {
        const runtime = useRuntimeStore();
        runtime.setTeleport({
            dialogName: "updateStock",
            dialogOk: true,
            dialogVisibility: true
        });
        runtime.optionMenuColors.set(3, "green");

        runtime.resetOptionsMenuColors();

        expect(runtime.optionMenuColors.size).toBe(0);
        // Dialog state unchanged
        expect(runtime.dialogVisibility).toBe(true);
        expect(runtime.dialogName).toBe("updateStock");
    });

    it("setCurrentView should change view and reset teleport state", () => {
        const runtime = useRuntimeStore();

        // Open a dialog first
        runtime.setTeleport({
            dialogName: "importDatabase",
            dialogOk: true,
            dialogVisibility: true
        });

        // Switch to a different view (HOME already default; use a different one)
        const someOtherView = "settings";
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
        expect(runtime.loadedStocksPagesAt.size).toBe(0);
    });

    it("markStocksPageLoaded + isStocksPageFresh should track recency", () => {
        const runtime = useRuntimeStore();

        expect(runtime.isStocksPageFresh(1, 60_000)).toBe(false);

        runtime.markStocksPageLoaded(1);
        expect(runtime.loadedStocksPages.has(1)).toBe(true);
        expect(runtime.isStocksPageFresh(1, 60_000)).toBe(true);

        // Make it stale
        runtime.loadedStocksPagesAt.set(1, Date.now() - 120_000);
        expect(runtime.isStocksPageFresh(1, 60_000)).toBe(false);
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
