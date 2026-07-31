/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/domain/types/domain";

export interface BackupMetadata {
    cVersion: number;
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
