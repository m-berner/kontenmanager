/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BookingDb, BookingTypeDb} from "@/domain/types/domain";
import type {AccountStoreItem} from "@/domain/types/uiLayer/account";
import type {StockItem} from "@/domain/types/uiLayer/fetch";

/**
 * Interface for the booking data store.
 */
export type BookingStoreContract = {
    /** List of all bookings currently in the store. */
    items: BookingDb[];
    /** Resets the booking store. */
    clean: () => void;
    /** Adds a booking to the store. */
    add: (_booking: BookingDb, _prepend?: boolean) => void;
};


/**
 * Interface for the booking type data store.
 */
export type BookingTypeStoreContract = {
    /** List of all booking categories. */
    items: BookingTypeDb[];
    /** Resets the booking type store. */
    clean: () => void;
    /** Adds a booking type to the store. */
    add: (_bookingType: BookingTypeDb, _prepend?: boolean) => void;
};


/**
 * Full set of store-ready items grouped by domain.
 */
export interface RecordsStoreData {
    accounts: AccountStoreItem[];
    bookings: BookingDb[];
    bookingTypes: BookingTypeDb[];
    stocks: StockItem[];
}

/**
 * Interface for application settings in the store.
 */
export type SettingsStoreContract = {
    /** ID of the account currently selected by the user. */
    activeAccountId: number;
};

/**
 * Interface for the stock data store.
 */
export type StockStoreContract = {
    /** List of all stocks currently in the store. */
    items: StockItem[];
    /** Resets the stock store. */
    clean: () => void;
    /** Adds a stock to the store. */
    add: (_stock: StockItem, _prepend?: boolean) => void;
};

