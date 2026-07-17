/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {setActiveTestPinia} from "@test/pinia";

const bookingsDelete = vi.fn().mockResolvedValue(undefined);
const stocksDelete = vi.fn().mockResolvedValue(undefined);
const feedbackInfo = vi.fn().mockResolvedValue(undefined);
const feedbackError = vi.fn().mockResolvedValue(undefined);

vi.mock("@/adapters/context", () => ({
    useAdapters: () => ({
        alertAdapter: {feedbackInfo, feedbackError},
        browserAdapter: {getMessage: (k: string) => k, getUserLocale: () => "de-DE"},
        fetchAdapter: {fetchMinRateMaxData: vi.fn(), fetchDateData: vi.fn(), clearCache: vi.fn()},
        storageAdapter: () => ({getStorage: vi.fn().mockResolvedValue({})}),
        repositories: {
            bookings: {delete: bookingsDelete},
            stocks: {delete: stocksDelete}
        }
    })
}));

import {useMenuAction, useMenuHighlight} from "@/adapters/ui/composables/useMenu";
import {useBookingsStore} from "@/adapters/ui/stores/bookings";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {makeBookingDb, makeStockDb} from "@test/usecases";

describe("useMenuHighlight", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it("highlight() marks a record as highlighted with the given color", () => {
        const {highlight, isHighlighted, getHighlightColor} = useMenuHighlight();
        highlight(1, "red");

        expect(isHighlighted(1)).toBe(true);
        expect(getHighlightColor(1)).toBe("red");
    });

    it("defaults to green when no color is given", () => {
        const {highlight, getHighlightColor} = useMenuHighlight();
        highlight(1);
        expect(getHighlightColor(1)).toBe("green");
    });

    it("clearHighlight() removes the highlight for one record", () => {
        const {highlight, clearHighlight, isHighlighted} = useMenuHighlight();
        highlight(1);

        clearHighlight(1);

        expect(isHighlighted(1)).toBe(false);
    });

    it("clearAllHighlights() removes every highlighted record", () => {
        const {highlight, clearAllHighlights, isHighlighted} = useMenuHighlight();
        highlight(1);
        highlight(2);

        clearAllHighlights();

        expect(isHighlighted(1)).toBe(false);
        expect(isHighlighted(2)).toBe(false);
    });

    it("highlightTemporary() auto-clears the highlight after the given duration", () => {
        const {highlightTemporary, isHighlighted} = useMenuHighlight();
        highlightTemporary(1, {duration: 1000});

        expect(isHighlighted(1)).toBe(true);
        vi.advanceTimersByTime(999);
        expect(isHighlighted(1)).toBe(true);
        vi.advanceTimersByTime(1);
        expect(isHighlighted(1)).toBe(false);
    });

    it("highlightTemporary() replaces an existing timer instead of stacking them", () => {
        const {highlightTemporary, isHighlighted} = useMenuHighlight();
        highlightTemporary(1, {duration: 1000});
        vi.advanceTimersByTime(500);
        highlightTemporary(1, {duration: 1000}); // restart the clock

        vi.advanceTimersByTime(999);
        expect(isHighlighted(1)).toBe(true);
        vi.advanceTimersByTime(1);
        expect(isHighlighted(1)).toBe(false);
    });
});

describe("useMenuAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setActiveTestPinia();
    });

    it("hasAction recognizes known action types and rejects unknown ones", () => {
        const {hasAction} = useMenuAction();
        expect(hasAction("addBooking")).toBe(true);
        expect(hasAction("notARealAction")).toBe(false);
    });

    it("executeAction opens the matching dialog via runtime teleport state", async () => {
        const runtime = useRuntimeStore();
        const {executeAction} = useMenuAction();

        await executeAction("addBooking", 0);

        expect(runtime.dialogName).toBe("addBooking");
        expect(runtime.dialogOk).toBe(true);
        expect(runtime.dialogVisibility).toBe(true);
    });

    it("executeAction sets runtime.activeId to the target record before running the handler", async () => {
        const runtime = useRuntimeStore();
        const {executeAction} = useMenuAction();

        await executeAction("updateBooking", 42);

        expect(runtime.activeId).toBe(42);
    });

    it("executeAction reports an error for an unknown action type", async () => {
        const {executeAction} = useMenuAction((k) => k);

        await executeAction("notARealAction" as never, 1);

        expect(feedbackError).toHaveBeenCalledWith(
            "composables.useMenu.title",
            "composables.useMenu.messages.invalidCode",
            {data: "notARealAction"}
        );
    });

    it("falls back to a fixed system message when no translate function is supplied", async () => {
        const {executeAction} = useMenuAction();

        await executeAction("notARealAction" as never, 1);

        expect(feedbackError).toHaveBeenCalledWith(
            "System error: resolveMessage",
            "System error: resolveMessage",
            {data: "notARealAction"}
        );
    });

    it("deleteBooking removes the booking from the repository and the store", async () => {
        const records = useRecordsStore();
        const bookings = useBookingsStore();
        bookings.add(makeBookingDb({cID: 1}));
        const {executeAction} = useMenuAction((k) => k);

        await executeAction("deleteBooking", 1);

        expect(bookingsDelete).toHaveBeenCalledWith(1);
        expect(records.bookings.items).toHaveLength(0);
    });

    it("deleteStock is blocked with a notice when the stock still has bookings", async () => {
        const records = useRecordsStore();
        records.stocks.add(makeStockDb({cID: 1}));
        records.bookings.add(makeBookingDb({cID: 1, cStockID: 1}));
        const {executeAction} = useMenuAction((k) => k);

        await executeAction("deleteStock", 1);

        expect(stocksDelete).not.toHaveBeenCalled();
        expect(feedbackInfo).toHaveBeenCalledWith(
            "composables.useMenu.title",
            "composables.useMenu.messages.noDelete"
        );
    });

    it("deleteStock succeeds when the stock has no linked bookings", async () => {
        const records = useRecordsStore();
        records.stocks.add(makeStockDb({cID: 1}));
        const {executeAction} = useMenuAction((k) => k);

        await executeAction("deleteStock", 1);

        expect(stocksDelete).toHaveBeenCalledWith(1);
        expect(records.stocks.items).toHaveLength(0);
    });

    it("openLink opens the stock's URL when present", async () => {
        const records = useRecordsStore();
        records.stocks.add(makeStockDb({cID: 1, cURL: "https://example.com"}));
        const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
        const {executeAction} = useMenuAction((k) => k);

        await executeAction("openLink", 1);

        expect(openSpy).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
        openSpy.mockRestore();
    });

    it("openLink shows a notice instead of opening a window when no URL is set", async () => {
        const records = useRecordsStore();
        records.stocks.add(makeStockDb({cID: 1, cURL: ""}));
        const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
        const {executeAction} = useMenuAction((k) => k);

        await executeAction("openLink", 1);

        expect(openSpy).not.toHaveBeenCalled();
        expect(feedbackInfo).toHaveBeenCalledWith(
            "composables.useMenu.title",
            "composables.useMenu.messages.noLink"
        );
        openSpy.mockRestore();
    });

    it("executeAction reports an error via alertAdapter when a handler throws", async () => {
        bookingsDelete.mockRejectedValueOnce(new Error("db down"));
        const records = useRecordsStore();
        const bookings = useBookingsStore();
        bookings.add(makeBookingDb({cID: 1}));
        const {executeAction} = useMenuAction((k) => k);

        await executeAction("deleteBooking", 1);

        expect(feedbackError).toHaveBeenCalledWith(
            "composables.useMenu.title",
            expect.any(Error),
            {data: "deleteBooking"}
        );
        // The failed repository call must not have removed the in-memory record.
        expect(records.bookings.items).toHaveLength(1);
    });
});