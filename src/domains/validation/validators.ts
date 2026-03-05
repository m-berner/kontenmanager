/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {validateIBAN, validateISIN} from "@/domains/validation/rules";
import {isoDate, isValidISODate, log, normalizeBookingTypeName, toNumber} from "@/domains/utils/utils";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/types";

/**
 * Domain-specific validators that use the core ValidationRules.
 * These are used by business logic and database layers.
 */

function normalizeString(value: unknown): string {
    if (typeof value !== "string") return "";
    return value.trim();
}

function normalizeAmount(value: unknown): number {
    const num = toNumber(value as string | number);
    return Number.isFinite(num) ? num : 0;
}

function normalizeDate(value: unknown): string {
    if (typeof value === "string" && isValidISODate(value)) {
        return value;
    }
    if (typeof value === "number") {
        try {
            return isoDate(value);
        } catch {
            log(
                "DOMAINS VALIDATION validators: Invalid numeric date value",
                value,
                "warn"
            );
        }
    }

    if (value !== undefined && value !== null && value !== "") {
        log(
            "DOMAINS VALIDATION validators: Invalid date value",
            value,
            "warn"
        );
    }

    // Explicit invalid-date fallback to avoid silently mutating data "today".
    return "";
}

export function validateBooking(data: unknown): BookingDb {
    if (typeof data !== "object" || data === null) {
        throw AppError(
            ERROR_CODES.VALIDATION.A,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }

    const raw = data as Record<string, unknown>;

    // Basic normalization
    const normalized: BookingDb = {
        cID: Number(raw.cID ?? 0),
        cBookDate: normalizeDate(raw.cBookDate),
        cExDate: normalizeDate(raw.cExDate),
        cDebit: normalizeAmount(raw.cDebit),
        cCredit: normalizeAmount(raw.cCredit),
        cDescription: normalizeString(raw.cDescription),
        cCount: normalizeAmount(raw.cCount),
        cBookingTypeID: Number(raw.cBookingTypeID ?? 0),
        cAccountNumberID: Number(raw.cAccountNumberID ?? 0),
        cStockID: Number(raw.cStockID ?? 0),
        cSoliCredit: normalizeAmount(raw.cSoliCredit),
        cSoliDebit: normalizeAmount(raw.cSoliDebit),
        cTaxCredit: normalizeAmount(raw.cTaxCredit),
        cTaxDebit: normalizeAmount(raw.cTaxDebit),
        cFeeCredit: normalizeAmount(raw.cFeeCredit),
        cFeeDebit: normalizeAmount(raw.cFeeDebit),
        cSourceTaxCredit: normalizeAmount(raw.cSourceTaxCredit),
        cSourceTaxDebit: normalizeAmount(raw.cSourceTaxDebit),
        cTransactionTaxCredit: normalizeAmount(raw.cTransactionTaxCredit),
        cTransactionTaxDebit: normalizeAmount(raw.cTransactionTaxDebit),
        cMarketPlace: normalizeString(raw.cMarketPlace)
    };

    // Domain rules
    if (normalized.cAccountNumberID === 0) {
        log(
            "DOMAINS VALIDATION validators: Booking missing account ID",
            normalized,
            "warn"
        );
    }

    return normalized;
}

export function validateAccount(data: unknown): AccountDb {
    if (typeof data !== "object" || data === null) {
        throw AppError(
            ERROR_CODES.VALIDATION.B,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
    const raw = data as Record<string, unknown>;

    const normalizedIban = normalizeString(raw.cIban);
    const ibanRes = validateIBAN(normalizedIban);
    if (!ibanRes.isValid) {
        log(
            "DOMAINS VALIDATION validators: Invalid IBAN",
            normalizedIban,
            "warn"
        );
    }

    return {
        cID: Number(raw.cID ?? 0),
        cSwift: normalizeString(raw.cSwift).toUpperCase(),
        cIban: normalizeString(raw.cIban).replace(/\s/g, "").toUpperCase(),
        cLogoUrl: normalizeString(raw.cLogoUrl),
        cWithDepot: Boolean(raw.cWithDepot)
    };
}

export function validateStock(data: unknown): StockDb {
    if (typeof data !== "object" || data === null) {
        throw AppError(
            ERROR_CODES.VALIDATION.C,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
    const raw = data as Record<string, unknown>;

    const normalizedIsin = normalizeString(raw.cISIN);
    const isinRes = validateISIN(normalizedIsin);
    if (!isinRes.isValid) {
        log(
            "DOMAINS VALIDATION validators: Invalid ISIN",
            normalizedIsin,
            "warn"
        );
    }

    return {
        cID: Number(raw.cID ?? 0),
        cCompany: normalizeString(raw.cCompany),
        cISIN: normalizeString(raw.cISIN).replace(/\s/g, "").toUpperCase(),
        cSymbol: normalizeString(raw.cSymbol).toUpperCase(),
        cFirstPage: Number(raw.cFirstPage ?? 0),
        cFadeOut: Number(raw.cFadeOut ?? 0),
        cMeetingDay: normalizeString(raw.cMeetingDay),
        cQuarterDay: normalizeString(raw.cQuarterDay),
        cURL: normalizeString(raw.cURL),
        cAccountNumberID: Number(raw.cAccountNumberID ?? 0),
        cAskDates: normalizeString(raw.cAskDates)
    };
}

export function validateBookingType(data: unknown): BookingTypeDb {
    if (typeof data !== "object" || data === null) {
        throw AppError(
            ERROR_CODES.VALIDATION.D,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
    const raw = data as Record<string, unknown>;
    return {
        cID: Number(raw.cID ?? 0),
        cName: normalizeBookingTypeName(
            normalizeString(raw.cName)
        ),
        cAccountNumberID: Number(raw.cAccountNumberID ?? 0)
    };
}

