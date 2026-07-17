/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it} from "vitest";
import {setActiveTestPinia} from "@test/pinia";
import {makeBookingDb, makeStockDb} from "@test/usecases";
import {INDEXED_DB} from "@/domain/constants";
import {usePortfolioStore} from "@/adapters/ui/stores/portfolio";
import {useBookingsStore} from "@/adapters/ui/stores/bookings";
import {useSettingsStore} from "@/adapters/ui/stores/settings";
import {useStocksStore} from "@/adapters/ui/stores/stocks";

const BUY = INDEXED_DB.STORE.BOOKING_TYPES.BUY;

describe("Portfolio Store", () => {
    beforeEach(() => {
        setActiveTestPinia();
    });

    it("computes portfolio quantity, invested amount, and euro change for an active stock", () => {
        const stocks = useStocksStore();
        const bookings = useBookingsStore();

        stocks.add(makeStockDb({cID: 1, cFadeOut: 0, cFirstPage: 1}));
        bookings.add(makeBookingDb({
            cID: 1, cStockID: 1, cBookingTypeID: BUY, cCount: 10, cDebit: 1000, cBookDate: "2026-01-01"
        }));

        const idx = stocks.getIndexById(1);
        stocks.items[idx].mValue = 120;

        const portfolio = usePortfolioStore();
        expect(portfolio.active).toHaveLength(1);
        const [entry] = portfolio.active;
        expect(entry.mPortfolio).toBe(10);
        expect(entry.mInvest).toBe(1000);
        expect(entry.mDeleteable).toBe(false);
        expect(entry.mEuroChange).toBe(120 * 10 - 1000);
    });

    it("marks a stock deleteable when it has no bookings", () => {
        const stocks = useStocksStore();
        stocks.add(makeStockDb({cID: 1, cFadeOut: 0, cFirstPage: 1}));

        const portfolio = usePortfolioStore();
        expect(portfolio.active[0].mDeleteable).toBe(true);
    });

    it("excludes faded-out stocks from active and includes them in passive", () => {
        const stocks = useStocksStore();
        stocks.add(makeStockDb({cID: 1, cFadeOut: 1, cFirstPage: 1}));

        const portfolio = usePortfolioStore();
        expect(portfolio.active).toHaveLength(0);
        expect(portfolio.passive).toHaveLength(1);
    });

    it("excludes the placeholder stock (cID 0) from active", () => {
        const stocks = useStocksStore();
        stocks.add(makeStockDb({cID: 0, cFadeOut: 0, cFirstPage: 1}));

        const portfolio = usePortfolioStore();
        expect(portfolio.active).toHaveLength(0);
    });

    it("sorts active stocks by first page desc, then portfolio quantity desc", () => {
        const stocks = useStocksStore();
        const bookings = useBookingsStore();

        stocks.add(makeStockDb({cID: 1, cFadeOut: 0, cFirstPage: 1}));
        stocks.add(makeStockDb({cID: 2, cFadeOut: 0, cFirstPage: 2}));
        stocks.add(makeStockDb({cID: 3, cFadeOut: 0, cFirstPage: 2}));
        bookings.add(makeBookingDb({cID: 1, cStockID: 2, cBookingTypeID: BUY, cCount: 5, cDebit: 100, cBookDate: "2026-01-01"}));
        bookings.add(makeBookingDb({cID: 2, cStockID: 3, cBookingTypeID: BUY, cCount: 10, cDebit: 100, cBookDate: "2026-01-01"}));

        const portfolio = usePortfolioStore();
        expect(portfolio.active.map((s) => s.cID)).toEqual([3, 2, 1]);
    });

    it("sumDepot returns 0 when no active account is selected", () => {
        const settings = useSettingsStore();
        settings.activeAccountId = -1;

        const portfolio = usePortfolioStore();
        expect(portfolio.sumDepot()).toBe(0);
    });

    it("sumDepot sums portfolio quantity times current value across active stocks", () => {
        const settings = useSettingsStore();
        const stocks = useStocksStore();
        const bookings = useBookingsStore();
        settings.activeAccountId = 1;

        stocks.add(makeStockDb({cID: 1, cFadeOut: 0, cFirstPage: 1}));
        bookings.add(makeBookingDb({
            cID: 1, cStockID: 1, cBookingTypeID: BUY, cCount: 10, cDebit: 1000, cBookDate: "2026-01-01"
        }));
        const idx = stocks.getIndexById(1);
        stocks.items[idx].mValue = 50;

        const portfolio = usePortfolioStore();
        expect(portfolio.sumDepot()).toBe(500);
    });
});