/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed} from "vue";

import * as DomainLogic from "@/domain/logic";
import type {StockItem} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useBookingsStore} from "@/adapters/primary/stores/bookings";
import {useSettingsStore} from "@/adapters/primary/stores/settings";
import {useStocksStore} from "@/adapters/primary/stores/stocks";

/**
 * Pure derived-state store for portfolio views.
 * Combines stocks + bookings + settings into computed aggregates.
 *
 * Online data loading (network side effects) lives in useOnlineStockData composable.
 */
export const usePortfolioStore = defineStore("portfolio", function () {
    const stocks = useStocksStore();
    const bookings = useBookingsStore();
    const settings = useSettingsStore();

    const passive = computed(() => stocks.passive);

    const active = computed((): StockItem[] => {
        return stocks.items
            .filter((rec) => rec.cFadeOut === 0 && (rec.cID as number) > 0)
            .map((rec) => {
                const mPortfolio = bookings.portfolioByStockId(rec.cID as number);
                const mInvest = bookings.investByStockId(rec.cID as number);
                const mDeleteable = !bookings.hasStockID(rec.cID as number);
                return {
                    ...rec,
                    mPortfolio,
                    mInvest,
                    mDeleteable,
                    // Derived for UI convenience; persisted/ram value may also update by online loads.
                    mEuroChange:
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

    const sumDepot = computed(() => (): number => {
        if (settings.activeAccountId === -1) return 0;
        return DomainLogic.calculateTotalDepotValue(active.value);
    });

    return {active, passive, sumDepot};
});

log("STORES portfolio");
