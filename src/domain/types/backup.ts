/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/domain/types/domain";

export interface BackupMetadata {
    /**
     * The writing app's manifest version, verbatim (e.g. `"1.10.0"`).
     *
     * Typed `number` until now, which forced `createExportMetadata` to encode it
     * by stripping the dots and parsing the remainder — an encoding that is not
     * order-preserving once any segment reaches two digits (`1.10.0` -> `1100`
     * while the *earlier* `1.2.10` -> `1210`, so a later release encodes to a
     * smaller number) and that collapses distinct versions (`1.2.3` and `12.3`
     * both give `123`). Nothing reads it — `validateBackup` gates on
     * `cDBVersion`, which `createExportMetadata` sets separately and correctly —
     * so it was inert; the cost was that every backup already written carries a
     * version stamp that cannot be compared or reliably decoded, leaving a
     * future migration wanting to branch on the writing version with no
     * trustworthy value. Storing the string preserves everything at no cost.
     */
    cVersion: string;
    cDBVersion: number;
    cEngine: string;
}

export interface ModernBackupData {
    sm: BackupMetadata;
    accounts: AccountDb[];
    bookings: BookingDb[];
    bookingTypes: BookingTypeDb[];
    stocks: StockDb[];
}

/**
 * Backup file format is versioned via `sm.cDBVersion`.
 */
export type BackupData = ModernBackupData;

export interface BackupValidationResult {
    isValid: boolean;
    version: number;
    error?: string;
}
