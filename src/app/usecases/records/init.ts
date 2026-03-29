/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {initializeRecords} from "@/domain/logic";
import type {
    AccountStoreContract,
    BookingStoreContract,
    BookingTypeStoreContract,
    RecordsDbData,
    SettingsStoreContract,
    StockStoreContract
} from "@/domain/types";

export async function initRecordsUsecase(
    storesDB: RecordsDbData,
    stores: {
        accounts: AccountStoreContract;
        bookings: BookingStoreContract;
        bookingTypes: BookingTypeStoreContract;
        stocks: StockStoreContract;
        settings: SettingsStoreContract;
    },
    messages: Record<string, string>,
    removeAccounts = true
): Promise<void> {
    await initializeRecords(storesDB, stores, messages, removeAccounts);
}

