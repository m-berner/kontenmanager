/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {closeDuplicateAppTab, ensureSingleAppTab, type SingleTabGuardAdapter} from "@/adapters/ui/entrypoints/singleTabGuard";

const makeTab = (id: number | undefined, windowId: number | undefined = id): browser.tabs.Tab => ({
    id,
    windowId,
    index: 0,
    highlighted: false,
    active: true,
    pinned: false,
    incognito: false
} as unknown as browser.tabs.Tab);

const makeAdapter = (overrides: Partial<SingleTabGuardAdapter> = {}): SingleTabGuardAdapter => ({
    tabsGetCurrent: vi.fn().mockResolvedValue(undefined),
    tabsQuery: vi.fn().mockResolvedValue([]),
    tabsUpdate: vi.fn().mockResolvedValue(undefined),
    windowsUpdate: vi.fn().mockResolvedValue(undefined),
    removeTab: vi.fn().mockResolvedValue(undefined),
    ...overrides
});

describe("ensureSingleAppTab", () => {
    it("proceeds (returns true) when this is the only app tab open", async () => {
        const myTab = makeTab(1);
        const adapter = makeAdapter({
            tabsGetCurrent: vi.fn().mockResolvedValue(myTab),
            tabsQuery: vi.fn().mockResolvedValue([myTab])
        });

        const result = await ensureSingleAppTab(adapter);

        expect(result).toBe(true);
        expect(adapter.removeTab).not.toHaveBeenCalled();
        expect(adapter.tabsUpdate).not.toHaveBeenCalled();
    });

    it("proceeds when the current tab can't be identified (not running inside a tab)", async () => {
        const adapter = makeAdapter({tabsGetCurrent: vi.fn().mockResolvedValue(undefined)});

        const result = await ensureSingleAppTab(adapter);

        expect(result).toBe(true);
        expect(adapter.tabsQuery).not.toHaveBeenCalled();
    });

    it("closes itself and focuses the surviving (lower-id) tab when it is not the survivor", async () => {
        const myTab = makeTab(5, 500);
        const survivor = makeTab(2, 200);
        const adapter = makeAdapter({
            tabsGetCurrent: vi.fn().mockResolvedValue(myTab),
            tabsQuery: vi.fn().mockResolvedValue([myTab, survivor])
        });

        const result = await ensureSingleAppTab(adapter);

        expect(result).toBe(false);
        expect(adapter.windowsUpdate).toHaveBeenCalledWith(200);
        expect(adapter.tabsUpdate).toHaveBeenCalledWith(2);
        expect(adapter.removeTab).toHaveBeenCalledWith(5);
    });

    it("survives and closes every other duplicate when it holds the lowest tab id", async () => {
        const myTab = makeTab(1, 100);
        const dup1 = makeTab(3, 300);
        const dup2 = makeTab(7, 700);
        const adapter = makeAdapter({
            tabsGetCurrent: vi.fn().mockResolvedValue(myTab),
            tabsQuery: vi.fn().mockResolvedValue([myTab, dup1, dup2])
        });

        const result = await ensureSingleAppTab(adapter);

        expect(result).toBe(true);
        expect(adapter.removeTab).toHaveBeenCalledWith(3);
        expect(adapter.removeTab).toHaveBeenCalledWith(7);
        expect(adapter.removeTab).toHaveBeenCalledTimes(2);
        expect(adapter.windowsUpdate).not.toHaveBeenCalled();
    });

    it("two concurrent checks (as if run from two tabs opened at once) agree on the same survivor", async () => {
        // Simulates both tabs' independent app.ts startup seeing the same
        // tab list at roughly the same time - both must reach the same
        // conclusion about who stays open, or neither/both would close.
        const tabA = makeTab(4, 400);
        const tabB = makeTab(9, 900);
        const sharedTabList = [tabA, tabB];

        const adapterA = makeAdapter({
            tabsGetCurrent: vi.fn().mockResolvedValue(tabA),
            tabsQuery: vi.fn().mockResolvedValue(sharedTabList)
        });
        const adapterB = makeAdapter({
            tabsGetCurrent: vi.fn().mockResolvedValue(tabB),
            tabsQuery: vi.fn().mockResolvedValue(sharedTabList)
        });

        const [resultA, resultB] = await Promise.all([
            ensureSingleAppTab(adapterA),
            ensureSingleAppTab(adapterB)
        ]);

        // tabA has the lower id, so it survives (and, as part of its own
        // cleanup pass, also tries to close the duplicate it sees - tabB);
        // tabB independently reaches the same conclusion and closes itself.
        // Both attempts target the same tab id - in a real browser, only one
        // of the two `removeTab(9)` calls actually closes anything, and the
        // other would reject with an "already closed" error (not simulated
        // by this mock, which unconditionally resolves; see the two tests
        // below for that failure path being handled safely).
        expect(resultA).toBe(true);
        expect(resultB).toBe(false);
        expect(adapterB.removeTab).toHaveBeenCalledWith(9);
        expect(adapterA.removeTab).toHaveBeenCalledWith(9);
    });

    it("proceeds (fails open) when the current tab can't be determined at all", async () => {
        const adapter = makeAdapter({
            tabsGetCurrent: vi.fn().mockRejectedValue(new Error("tabs API unavailable"))
        });

        const result = await ensureSingleAppTab(adapter);

        expect(result).toBe(true);
    });

    it("still closes itself and returns false even if focusing the survivor fails", async () => {
        // Regression test: a failure in the best-effort "focus the survivor"
        // step must not fall through to the outer fail-open catch, which
        // would otherwise mount a second live app instance alongside the
        // survivor - reintroducing the exact cross-tab desync this guard
        // exists to prevent.
        const myTab = makeTab(5, 500);
        const survivor = makeTab(2, 200);
        const adapter = makeAdapter({
            tabsGetCurrent: vi.fn().mockResolvedValue(myTab),
            tabsQuery: vi.fn().mockResolvedValue([myTab, survivor]),
            windowsUpdate: vi.fn().mockRejectedValue(new Error("window already closed"))
        });

        const result = await ensureSingleAppTab(adapter);

        expect(result).toBe(false);
        expect(adapter.removeTab).toHaveBeenCalledWith(5);
    });

    it("still returns false (does not fail open) even if closing itself also fails", async () => {
        // Regression test: the "not the survivor" branch must never return
        // true, even in the worst case where this tab can't even close
        // itself - a stuck, unmounted blank tab is a strictly better outcome
        // than two simultaneously-mounted app instances silently desyncing
        // data.
        const myTab = makeTab(5, 500);
        const survivor = makeTab(2, 200);
        const adapter = makeAdapter({
            tabsGetCurrent: vi.fn().mockResolvedValue(myTab),
            tabsQuery: vi.fn().mockResolvedValue([myTab, survivor]),
            removeTab: vi.fn().mockRejectedValue(new Error("tab already gone"))
        });

        const result = await ensureSingleAppTab(adapter);

        expect(result).toBe(false);
    });
});

describe("closeDuplicateAppTab", () => {
    it("does nothing when it's the only app tab open", async () => {
        const newTab = makeTab(9, 900);
        const adapter = makeAdapter({tabsQuery: vi.fn().mockResolvedValue([newTab])});

        await closeDuplicateAppTab(adapter, newTab);

        expect(adapter.removeTab).not.toHaveBeenCalled();
        expect(adapter.tabsUpdate).not.toHaveBeenCalled();
    });

    it("closes the new tab and focuses the existing one when a duplicate is detected", async () => {
        const existing = makeTab(2, 200);
        const newTab = makeTab(9, 900);
        const adapter = makeAdapter({tabsQuery: vi.fn().mockResolvedValue([existing, newTab])});

        await closeDuplicateAppTab(adapter, newTab);

        expect(adapter.windowsUpdate).toHaveBeenCalledWith(200);
        expect(adapter.tabsUpdate).toHaveBeenCalledWith(2);
        expect(adapter.removeTab).toHaveBeenCalledWith(9);
    });

    it("does nothing (and doesn't throw) when the new tab has no id", async () => {
        const newTab = makeTab(undefined);
        const adapter = makeAdapter();

        await expect(closeDuplicateAppTab(adapter, newTab)).resolves.toBeUndefined();

        expect(adapter.tabsQuery).not.toHaveBeenCalled();
    });

    it("never throws, even if the underlying check fails entirely", async () => {
        const newTab = makeTab(9, 900);
        const adapter = makeAdapter({tabsQuery: vi.fn().mockRejectedValue(new Error("tabs API unavailable"))});

        await expect(closeDuplicateAppTab(adapter, newTab)).resolves.toBeUndefined();
    });

    it("still closes the duplicate even if focusing the existing tab fails", async () => {
        const existing = makeTab(2, 200);
        const newTab = makeTab(9, 900);
        const adapter = makeAdapter({
            tabsQuery: vi.fn().mockResolvedValue([existing, newTab]),
            windowsUpdate: vi.fn().mockRejectedValue(new Error("window already closed"))
        });

        await closeDuplicateAppTab(adapter, newTab);

        expect(adapter.removeTab).toHaveBeenCalledWith(9);
    });
});
