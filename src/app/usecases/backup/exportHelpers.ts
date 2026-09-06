/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/domain/constants";
import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/domain/types";
import {findReferentialIssues} from "@/domain/validation/referentialIntegrity";

export type ExportConsistencyIssues = {
    noAccounts: boolean;
    invalidBookings: number;
    invalidStocks: number;
    invalidBookingTypes: number;
};

export function createExportFilename(prefixIsoDate: string): string {
    return `${prefixIsoDate}_${INDEXED_DB.CURRENT_VERSION}_${INDEXED_DB.NAME}.json`;
}

/**
 * Builds the `sm` block written at the head of every backup.
 *
 * `cVersion` is the manifest version verbatim — see `BackupMetadata.cVersion`
 * for why the previous dot-stripping encode was lossy and unorderable.
 */
export function createExportMetadata(manifestVersion: string): {
    cVersion: string;
    cDBVersion: number;
    cEngine: "indexeddb";
} {
    return {
        cVersion: manifestVersion,
        cDBVersion: INDEXED_DB.CURRENT_VERSION,
        cEngine: "indexeddb"
    };
}

/**
 * UTF-8 byte length of `data`, counted without materializing the bytes.
 *
 * `new TextEncoder().encode(data).length` returns the same number but allocates
 * a `Uint8Array` as long as the encoded string just to read `.length` off it.
 * This runs on the export path, where the string can approach
 * `MAX_EXPORT_SIZE_KB` (64 MB) and is already held alongside the four record
 * arrays it was serialized from — so the copy is a whole extra buffer at the
 * worst possible moment.
 *
 * (The other full pass on that path, `verifyExportIntegrity`'s `JSON.parse`, is
 * deliberate and stays: re-parsing the exact string that will be written is the
 * check, not an accident of implementation.)
 */
function utf8ByteLength(text: string): number {
    let bytes = 0;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code < 0x80) {
            bytes += 1;
        } else if (code < 0x800) {
            bytes += 2;
        } else if (code >= 0xd800 && code <= 0xdbff) {
            // High surrogate. A well-formed pair encodes to 4 bytes and consumes
            // both halves; an unpaired one is replaced by U+FFFD, which is 3 —
            // matching what TextEncoder does with a lone surrogate.
            const next = text.charCodeAt(i + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
                bytes += 4;
                i++;
            } else {
                bytes += 3;
            }
        } else {
            // Includes an unpaired LOW surrogate, likewise replaced by U+FFFD.
            bytes += 3;
        }
    }
    return bytes;
}

export function estimateSizeKb(data: string): number {
    return utf8ByteLength(data) / 1024;
}

/**
 * Surveys the data about to be exported for dangling references.
 *
 * Runs the shared `findReferentialIssues` rather than its own account-only
 * traversal, so the export now blocks on exactly what the *import* rejects.
 * Previously it checked only `cAccountNumberID` on the three child collections,
 * which meant a database holding a dangling `cStockID` — deleting a stock that
 * still had bookings produces one — exported cleanly and then failed to restore.
 * `invalidBookings` therefore now counts a booking with any bad reference, not
 * only a bad account reference.
 */
export function findExportConsistencyIssues(input: {
    accounts: AccountDb[];
    bookings: BookingDb[];
    stocks: StockDb[];
    bookingTypes: BookingTypeDb[];
}): ExportConsistencyIssues {
    const issues = findReferentialIssues(input);
    const invalidBookings = new Set([
        ...issues.bookingsMissingAccount,
        ...issues.bookingsMissingStock,
        ...issues.bookingsMissingBookingType
    ]);

    return {
        noAccounts: input.accounts.length === 0,
        invalidBookings: invalidBookings.size,
        invalidStocks: issues.stocksMissingAccount.length,
        invalidBookingTypes: issues.bookingTypesMissingAccount.length
    };
}

/**
 * True when the data about to be exported contains a dangling reference.
 *
 * `noAccounts` is deliberately **not** part of this. It is still reported on
 * {@link ExportConsistencyIssues} because the caller has to act on it, but an
 * empty database is not an inconsistent one — folding the two together meant
 * `exportDatabaseUsecase` threw `EXPORT_DATABASE.A` ("Export validation
 * failed") for a user who had just installed the extension and clicked Export.
 * The refusal is right; the diagnosis was not. `export.ts` now checks
 * `issues.noAccounts` separately and throws `EXPORT_DATABASE.EMPTY`.
 */
export function hasExportConsistencyIssues(issues: ExportConsistencyIssues): boolean {
    return (
        issues.invalidBookings > 0 ||
        issues.invalidStocks > 0 ||
        issues.invalidBookingTypes > 0
    );
}