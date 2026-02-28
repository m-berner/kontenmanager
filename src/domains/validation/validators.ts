/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {ValidationRules} from "./rules";
import {DomainUtils} from "@/domains/utils";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/types";

/**
 * Domain-specific validators that use the core ValidationRules.
 * These are used by business logic and database layers.
 */
export class DomainValidators {
    static validateBooking(data: unknown): BookingDb {
        if (typeof data !== "object" || data === null) {
            throw new AppError(
                ERROR_CODES.VALIDATION.A,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }

        const raw = data as Record<string, unknown>;

        // Basic normalization
        const normalized: BookingDb = {
            cID: Number(raw.cID ?? 0),
            cBookDate: this.normalizeDate(raw.cBookDate),
            cExDate: this.normalizeDate(raw.cExDate),
            cDebit: this.normalizeAmount(raw.cDebit),
            cCredit: this.normalizeAmount(raw.cCredit),
            cDescription: this.normalizeString(raw.cDescription),
            cCount: this.normalizeAmount(raw.cCount),
            cBookingTypeID: Number(raw.cBookingTypeID ?? 0),
            cAccountNumberID: Number(raw.cAccountNumberID ?? 0),
            cStockID: Number(raw.cStockID ?? 0),
            cSoliCredit: this.normalizeAmount(raw.cSoliCredit),
            cSoliDebit: this.normalizeAmount(raw.cSoliDebit),
            cTaxCredit: this.normalizeAmount(raw.cTaxCredit),
            cTaxDebit: this.normalizeAmount(raw.cTaxDebit),
            cFeeCredit: this.normalizeAmount(raw.cFeeCredit),
            cFeeDebit: this.normalizeAmount(raw.cFeeDebit),
            cSourceTaxCredit: this.normalizeAmount(raw.cSourceTaxCredit),
            cSourceTaxDebit: this.normalizeAmount(raw.cSourceTaxDebit),
            cTransactionTaxCredit: this.normalizeAmount(raw.cTransactionTaxCredit),
            cTransactionTaxDebit: this.normalizeAmount(raw.cTransactionTaxDebit),
            cMarketPlace: this.normalizeString(raw.cMarketPlace)
        };

        // Domain rules
        if (normalized.cAccountNumberID === 0) {
            DomainUtils.log(
                "DOMAINS VALIDATION validators: Booking missing account ID",
                normalized,
                "warn"
            );
        }

        return normalized;
    }

    static validateAccount(data: unknown): AccountDb {
        if (typeof data !== "object" || data === null) {
            throw new AppError(
                ERROR_CODES.VALIDATION.B,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }
        const raw = data as Record<string, unknown>;

        const normalizedIban = this.normalizeString(raw.cIban);
        const ibanRes = ValidationRules.validateIBAN(normalizedIban);
        if (!ibanRes.isValid) {
            DomainUtils.log(
                "DOMAINS VALIDATION validators: Invalid IBAN",
                normalizedIban,
                "warn"
            );
        }

        return {
            cID: Number(raw.cID ?? 0),
            cSwift: this.normalizeString(raw.cSwift).toUpperCase(),
            cIban: this.normalizeString(raw.cIban).replace(/\s/g, "").toUpperCase(),
            cLogoUrl: this.normalizeString(raw.cLogoUrl),
            cWithDepot: Boolean(raw.cWithDepot)
        };
    }

    static validateStock(data: unknown): StockDb {
        if (typeof data !== "object" || data === null) {
            throw new AppError(
                ERROR_CODES.VALIDATION.C,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }
        const raw = data as Record<string, unknown>;

        const normalizedIsin = this.normalizeString(raw.cISIN);
        const isinRes = ValidationRules.validateISIN(normalizedIsin);
        if (!isinRes.isValid) {
            DomainUtils.log(
                "DOMAINS VALIDATION validators: Invalid ISIN",
                normalizedIsin,
                "warn"
            );
        }

        return {
            cID: Number(raw.cID ?? 0),
            cCompany: this.normalizeString(raw.cCompany),
            cISIN: this.normalizeString(raw.cISIN).replace(/\s/g, "").toUpperCase(),
            cSymbol: this.normalizeString(raw.cSymbol).toUpperCase(),
            cFirstPage: Number(raw.cFirstPage ?? 0),
            cFadeOut: Number(raw.cFadeOut ?? 0),
            cMeetingDay: this.normalizeString(raw.cMeetingDay),
            cQuarterDay: this.normalizeString(raw.cQuarterDay),
            cURL: this.normalizeString(raw.cURL),
            cAccountNumberID: Number(raw.cAccountNumberID ?? 0),
            cAskDates: this.normalizeString(raw.cAskDates)
        };
    }

    static validateBookingType(data: unknown): BookingTypeDb {
        if (typeof data !== "object" || data === null) {
            throw new AppError(
                ERROR_CODES.VALIDATION.D,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }
        const raw = data as Record<string, unknown>;
        return {
            cID: Number(raw.cID ?? 0),
            cName: DomainUtils.normalizeBookingTypeName(
                this.normalizeString(raw.cName)
            ),
            cAccountNumberID: Number(raw.cAccountNumberID ?? 0)
        };
    }

    private static normalizeString(value: unknown): string {
        if (typeof value !== "string") return "";
        return value.trim();
    }

    private static normalizeAmount(value: unknown): number {
        const num = DomainUtils.toNumber(value as string | number);
        return Number.isFinite(num) ? num : 0;
    }

    private static normalizeDate(value: unknown): string {
        if (typeof value === "string" && DomainUtils.isValidISODate(value)) {
            return value;
        }
        if (typeof value === "number") {
            try {
                return DomainUtils.isoDate(value);
            } catch {
                DomainUtils.log(
                    "DOMAINS VALIDATION validators: Invalid numeric date value",
                    value,
                    "warn"
                );
            }
        }

        if (value !== undefined && value !== null && value !== "") {
            DomainUtils.log(
                "DOMAINS VALIDATION validators: Invalid date value",
                value,
                "warn"
            );
        }

        // Explicit invalid-date fallback to avoid silently mutating data to "today".
        return "";
    }
}
