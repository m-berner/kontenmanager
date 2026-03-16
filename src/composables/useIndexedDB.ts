/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BatchOperationDescriptor, StockItem} from "@/types";
import {databaseService} from "@/services/database/service";
import {validateStock} from "@/domains/validation/validators";
import {log} from "@/domains/utils/utils";
import {
    accountsRepository,
    bookingsRepository,
    bookingTypesRepository,
    stocksRepository
} from "@/services/database/repositories";

/**
 * Composable for interacting with the 'accounts' IndexedDB store.
 */
export function useAccountsDB() {
    return {
        ...accountsRepository,
        /** Atomic multi-store import. */
        atomicImport: (
            stores: BatchOperationDescriptor[]
        ) => databaseService.atomicImport(stores)
    };
}

/**
 * Composable for interacting with the 'bookings' IndexedDB store.
 */
export function useBookingsDB() {
    return {
        ...bookingsRepository,
        /** Atomic multi-store import. */
        atomicImport: (
            stores: BatchOperationDescriptor[]
        ) => databaseService.atomicImport(stores)
    };
}

/**
 * Composable for interacting with the 'bookingTypes' IndexedDB store.
 */
export function useBookingTypesDB() {
    return {
        ...bookingTypesRepository,
        /** Atomic multi-store import. */
        atomicImport: (
            stores: BatchOperationDescriptor[]
        ) => databaseService.atomicImport(stores)
    };
}

/**
 * Composable for interacting with the 'stocks' IndexedDB store.
 * Includes a customized update method that strips RAM-only properties.
 */
export function useStocksDB() {
    return {
        ...stocksRepository,
        /** Atomic multi-store import. */
        atomicImport: (
            stores: BatchOperationDescriptor[]
        ) => databaseService.atomicImport(stores),
        /**
         * Updates a stock record, ensuring only database-relevant fields are sent.
         * Strips calculated properties (prefix 'm').
         *
         * @param stockData - The full stock object including RAM state.
         * @param tx - Optional existing transaction.
         */
        save: (stockData: StockItem, tx?: IDBTransaction) => {
            const {
                mPortfolio,
                mInvest,
                mChange,
                mBuyValue,
                mEuroChange,
                mMin,
                mValue,
                mMax,
                mDividendYielda,
                mDividendYeara,
                mDividendYieldb,
                mDividendYearb,
                mRealDividend,
                mRealBuyValue,
                mDeleteable,
                ...cleanData
            } = stockData;
            return stocksRepository.save(
                validateStock(cleanData),
                {tx}
            );
        }
    };
}

log("COMPOSABLES useIndexedDB");
