/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed} from "vue";

import {INDEXED_DB} from "@/domain/constants";
import * as DomainLogic from "@/domain/logic";
import type {StockItem} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useBookingsStore} from "@/adapters/ui/stores/bookings";
import {useBookingTypesStore} from "@/adapters/ui/stores/bookingTypes";
import {useSettingsStore} from "@/adapters/ui/stores/settings";
import {useStocksStore} from "@/adapters/ui/stores/stocks";

/**
 * Pure derived-state store for portfolio views.
 * Combines stocks + bookings + settings into computed aggregates.
 *
 * Online data loading (network side effects) lives in useOnlineStockData composable.
 */
export const usePortfolioStore = defineStore("portfolio", function () {
    const stocks = useStocksStore();
    const bookings = useBookingsStore();
    const bookingTypes = useBookingTypesStore();
    const settings = useSettingsStore();

    const passive = computed(() => stocks.passive);

    const active = computed((): StockItem[] => {
        return stocks.items
            .filter((rec) => rec.cFadeOut === 0 && (rec.cID as number) > 0)
            .map((rec) => {
                const mPortfolio = bookings.portfolioByStockId(rec.cID as number, bookingTypes.items);
                const mInvest = bookings.investByStockId(rec.cID as number, bookingTypes.items);
                const mDeleteable = !bookings.hasStockID(rec.cID as number);
                return {
                    ...rec,
                    mPortfolio,
                    mInvest,
                    mDeleteable,
                    // Derived for UI convenience; persisted/ram value may also update by online loads.
                    mChange:
                        (rec.mValue ?? 0) * (mPortfolio ?? 0) - (mInvest ?? 0)
                };
            })
            .sort((a, b) => {
                const firstPageDiff = b.cFirstPage - a.cFirstPage;
                return firstPageDiff !== 0
                    ? firstPageDiff
                    : (b.mPortfolio ?? 0) - (a.mPortfolio ?? 0);
            });
    });

    /**
     * Total value of the active account's depot.
     *
     * A plain computed **value**, not a computed returning a zero-argument
     * function. That wrapper is this codebase's idiom for *parameterised*
     * getters (`getById`, `sumFees(y)`), where it is necessary — here there are
     * no parameters, so it bought nothing and disabled the caching outright:
     * `computed` cached only the function's identity while the body re-ran on
     * every `sumDepot()` call.
     *
     * The cost was not trivial. Each call runs `calculateTotalDepotValue` over
     * `active`, which is itself a filter+map+sort calling `portfolioByStockId`
     * and `investByStockId` per stock, each of which walks every booking — so
     * reading the depot total was O(stocks × bookings), recomputed per read
     * rather than per dependency change, from an always-mounted app bar that
     * re-renders often.
     */
    const sumDepot = computed((): number => {
        // `INDEXED_DB.INVALID_ID`, not a bare `-1` — the named "no active
        // account" sentinel every other call site in the write layer compares
        // against (see `deleteActiveAccountUsecase`'s note on exactly this).
        //
        // Deliberately NOT `recordsHub.hasActiveAccount`, which additionally
        // requires the id to resolve to a still-present account. That predicate
        // guards *writes* and dialog entry — "can I record a booking under this
        // account?" — and it is the wrong question here. This getter aggregates
        // `portfolio.active`, i.e. whatever stocks are actually loaded, and
        // `CompanyContent` renders those same rows with their values regardless.
        // Returning 0 for a dangling id would put a 0 in the app bar above a
        // table full of holdings, trading one inconsistency for a worse one.
        if (settings.activeAccountId === INDEXED_DB.INVALID_ID) return 0;
        return DomainLogic.calculateTotalDepotValue(active.value);
    });

    return {active, passive, sumDepot};
});

log("STORES portfolio");
