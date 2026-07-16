/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {setActiveTestPinia} from "@test/pinia";

const feedbackInfo = vi.fn().mockResolvedValue(undefined);
const feedbackError = vi.fn().mockResolvedValue(undefined);
const clearCache = vi.fn();
const openOptionsPage = vi.fn().mockResolvedValue(undefined);

vi.mock("@/adapters/context", () => ({
    useAdapters: () => ({
        alertAdapter: {feedbackInfo, feedbackError},
        browserAdapter: {getUserLocale: () => "de-DE", openOptionsPage},
        fetchAdapter: {fetchMinRateMaxData: vi.fn(), fetchDateData: vi.fn(), clearCache},
        storageAdapter: () => ({getStorage: vi.fn().mockResolvedValue({})})
    })
}));

import {useHeaderBarActions} from "@/adapters/ui/composables/useHeaderBarActions";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {makeAccountDb, makeBookingDb, makeBookingTypeDb, makeStockDb} from "@test/usecases";

const t = (key: string) => key;

function clickEventFor(id: string, bubbledFromChild = false): Event {
    const el = document.createElement("button");
    el.id = id;
    if (bubbledFromChild) {
        const child = document.createElement("span");
        el.appendChild(child);
        return {currentTarget: el, target: child} as unknown as Event;
    }
    return {currentTarget: el, target: el} as unknown as Event;
}

describe("useHeaderBarActions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setActiveTestPinia();
    });

    describe("onIconClick element resolution", () => {
        it("resolves the action from the id of currentTarget", async () => {
            const runtime = useRuntimeStore();
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("addStock"));

            expect(runtime.dialogName).toBe("addStock");
        });

        it("falls back to the closest ancestor id when the click bubbled from a child element", async () => {
            const runtime = useRuntimeStore();
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("addStock", true));

            expect(runtime.dialogName).toBe("addStock");
        });

        it("does nothing when the clicked element has no id", async () => {
            const runtime = useRuntimeStore();
            const {onIconClick} = useHeaderBarActions(t);
            const el = document.createElement("div");

            await onIconClick({currentTarget: el, target: el} as unknown as Event);

            expect(runtime.dialogName).toBeUndefined();
        });

        it("does nothing when the id does not match a known action", async () => {
            const runtime = useRuntimeStore();
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("someUnrelatedButton"));

            expect(runtime.dialogName).toBeUndefined();
        });
    });

    describe("account-gated actions", () => {
        it("updateAccount shows a notice instead of opening the dialog when there are no accounts", async () => {
            const runtime = useRuntimeStore();
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("updateAccount"));

            expect(feedbackInfo).toHaveBeenCalledWith("views.headerBar.infoTitle", "views.headerBar.messages.noAccount");
            expect(runtime.dialogName).toBeUndefined();
        });

        it("updateAccount opens the dialog once an account exists", async () => {
            const records = useRecordsStore();
            const runtime = useRuntimeStore();
            records.accounts.add(makeAccountDb({cID: 1}));
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("updateAccount"));

            expect(feedbackInfo).not.toHaveBeenCalled();
            expect(runtime.dialogName).toBe("updateAccount");
        });

        it("exportDatabase is also gated on having at least one account", async () => {
            const runtime = useRuntimeStore();
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("exportDatabase"));

            expect(feedbackInfo).toHaveBeenCalledWith("views.headerBar.infoTitle", "views.headerBar.messages.noAccount");
            expect(runtime.dialogName).toBeUndefined();
        });
    });

    describe("booking-type-gated actions", () => {
        it("updateBookingType shows a notice when there are no booking types", async () => {
            const {onIconClick} = useHeaderBarActions(t);
            await onIconClick(clickEventFor("updateBookingType"));

            expect(feedbackInfo).toHaveBeenCalledWith("views.headerBar.infoTitle", "views.headerBar.messages.noBookingType");
        });

        it("updateBookingType opens the dialog once a booking type exists", async () => {
            const records = useRecordsStore();
            const runtime = useRuntimeStore();
            records.bookingTypes.add(makeBookingTypeDb({cID: 1}));
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("updateBookingType"));

            expect(runtime.dialogName).toBe("updateBookingType");
        });
    });

    describe("fadeInStock", () => {
        it("shows a notice when there are no faded-out (passive) stocks", async () => {
            const {onIconClick} = useHeaderBarActions(t);
            await onIconClick(clickEventFor("fadeInStock"));

            expect(feedbackInfo).toHaveBeenCalledWith("views.headerBar.infoTitle", "views.headerBar.messages.noCompany");
        });

        it("opens the dialog when at least one passive stock exists", async () => {
            const records = useRecordsStore();
            const runtime = useRuntimeStore();
            records.stocks.add(makeStockDb({cID: 1, cFadeOut: 1}));
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("fadeInStock"));

            expect(runtime.dialogName).toBe("fadeInStock");
        });
    });

    describe("showAccounting", () => {
        it("shows a notice when there are no bookings yet", async () => {
            const {onIconClick} = useHeaderBarActions(t);
            await onIconClick(clickEventFor("showAccounting"));

            expect(feedbackInfo).toHaveBeenCalledWith("views.headerBar.infoTitle", "views.headerBar.messages.noBooking");
        });

        it("opens the (non-modal) accounting dialog once a booking exists", async () => {
            const records = useRecordsStore();
            const runtime = useRuntimeStore();
            records.bookings.add(makeBookingDb({cID: 1}));
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("showAccounting"));

            expect(runtime.dialogName).toBe("showAccounting");
            expect(runtime.dialogOk).toBe(false);
        });
    });

    describe("navigation and settings", () => {
        it("home/company switch the current view", async () => {
            const runtime = useRuntimeStore();
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("company"));
            expect(runtime.getCurrentView).toBe("company");

            await onIconClick(clickEventFor("home"));
            expect(runtime.getCurrentView).toBe("home");
        });

        it("setting opens the browser's options page", async () => {
            const {onIconClick} = useHeaderBarActions(t);
            await onIconClick(clickEventFor("setting"));

            expect(openOptionsPage).toHaveBeenCalledTimes(1);
        });

        it("importDatabase always opens the dialog, with no gating", async () => {
            const runtime = useRuntimeStore();
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("importDatabase"));

            expect(runtime.dialogName).toBe("importDatabase");
        });
    });

    describe("updateQuote", () => {
        it("clears the fetch cache, refreshes online data, and resets loading flags on success", async () => {
            const runtime = useRuntimeStore();
            const {onIconClick} = useHeaderBarActions(t);

            await onIconClick(clickEventFor("updateQuote"));

            expect(clearCache).toHaveBeenCalledTimes(1);
            expect(runtime.isStockLoading).toBe(false);
            expect(runtime.isDownloading).toBe(false);
            expect(feedbackError).not.toHaveBeenCalled();
        });
    });
});