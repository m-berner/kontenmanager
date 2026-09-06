/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BookingTypeRoleType} from "@/domain/constants";
import {BOOKING_TYPE_ROLE, CURRENCIES, ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, serializeError} from "@/domain/errors";
import type {AccountRecord, BookingDb, BookingTypeDb, StockRecord} from "@/domain/types";
import {isoDate, isValidISODate, log, round2, toNumber} from "@/domain/utils/utils";
import {validateIBAN, validateISIN} from "@/domain/validation/rules";

const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;

// Default booking-type labels shipped in each locale's gui.json
// (components.dialogs.addAccount.bookingTypes.{buy,sell,dividend} — the labels
// of addAccountUsecases defaults are created with), used only as a best-effort fallback to
// classify legacy rows that predate the `cRole` field. Lowercased to match
// resolveLegacyBookingTypeRole's comparison.
const DEFAULT_BUY_NAMES = new Set(["stock purchase", "aktienkauf"]);
const DEFAULT_SELL_NAMES = new Set(["stock sale", "aktienverkauf"]);
const DEFAULT_DIVIDEND_NAMES = new Set(["dividend", "dividende"]);

/**
 * Best-effort classification of a booking type's role for records that predate the `cRole`
 * field (pre-migration IndexedDB rows, backups exported before this field existed). Matches
 * first by the row's name against the default labels shipped in either locale, then falls back
 * to the historical global-`cID` convention (1/2/3). This is only actually correct for the
 * first depot account ever created in a given IndexedDB instance. Anything else defaults to
 * `"other"` — the same outcome these rows already have today, so this is never a regression.
 *
 * @param cID - The booking type's own id.
 * @param cName - The booking type's name.
 * @returns The best-effort resolved role.
 */
export function resolveLegacyBookingTypeRole(
    cID: number,
    cName: string
): BookingTypeRoleType {
    const name = normalizeBookingTypeName(cName).toLowerCase();
    if (DEFAULT_BUY_NAMES.has(name)) return BOOKING_TYPE_ROLE.BUY;
    if (DEFAULT_SELL_NAMES.has(name)) return BOOKING_TYPE_ROLE.SELL;
    if (DEFAULT_DIVIDEND_NAMES.has(name)) return BOOKING_TYPE_ROLE.DIVIDEND;
    if (cID === BOOKING_TYPES.BUY) return BOOKING_TYPE_ROLE.BUY;
    if (cID === BOOKING_TYPES.SELL) return BOOKING_TYPE_ROLE.SELL;
    if (cID === BOOKING_TYPES.DIVIDEND) return BOOKING_TYPE_ROLE.DIVIDEND;
    return BOOKING_TYPE_ROLE.OTHER;
}

function isValidRole(value: unknown): value is BookingTypeRoleType {
    return (
        value === BOOKING_TYPE_ROLE.BUY ||
        value === BOOKING_TYPE_ROLE.SELL ||
        value === BOOKING_TYPE_ROLE.DIVIDEND ||
        value === BOOKING_TYPE_ROLE.OTHER
    );
}

export function normalizeBookingTypeName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
}

/**
 * Validates and normalizes account data and returns a structured account object.
 *
 * @param data - Raw account data to be validated and processed. Must be an object.
 * @returns The validated and normalized account data object.
 * @throws {@link AppError} If the input data is not an object or is null.
 */
export function validateAccount(data: unknown): AccountRecord {
    if (typeof data !== "object" || data === null) {
        throw appError(
            ERROR_DEFINITIONS.VALIDATION.B.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
    const raw = data as Record<string, unknown>;

    const normalizedIban = normalizeString(raw.cIban);
    const ibanRes = validateIBAN(normalizedIban);
    if (!ibanRes.isValid) {
        log(
            "DOMAIN VALIDATION validators: Invalid IBAN",
            normalizedIban,
            "warn"
        );
    }

    return {
        cID: Number(raw.cID ?? 0),
        cSwift: normalizeString(raw.cSwift).toUpperCase(),
        cIban: normalizeString(raw.cIban).replace(/\s/g, "").toUpperCase(),
        cLogoUrl: normalizeString(raw.cLogoUrl),
        cWithDepot: Boolean(raw.cWithDepot),
        cCurrency: normalizeCurrency(raw.cCurrency)
    };
}

/**
 * Coerces a raw value into one of `CURRENCIES.SUPPORTED`, defaulting to EUR.
 *
 * The default is what lets a pre-v29 backup import cleanly: `cCurrency` did not
 * exist before schema 29, and `MIN_SUPPORTED_VERSION` is still 27, so a
 * legitimate older export simply has no such field. EUR is the truthful default
 * for this app's existing data — the same value schema migration 29 stamps onto
 * rows already in IndexedDB.
 *
 * An *unsupported* code is coerced rather than rejected for the reason
 * `CURRENCIES.SUPPORTED` documents: the divisor chain in `useOnlineStockData`
 * has a rate only for EUR and USD, so storing e.g. "CHF" would produce an
 * account whose quotes silently pass through unconverted. Coercing keeps the
 * stored value and the conversion capability in agreement.
 *
 * @param value - The raw `cCurrency` from a backup, a form, or an IndexedDB row.
 * @returns A supported ISO currency code.
 */
function normalizeCurrency(value: unknown): string {
    const code = normalizeString(value).toUpperCase();
    return (CURRENCIES.SUPPORTED as readonly string[]).includes(code)
        ? code
        : CURRENCIES.EUR;
}

/**
 * Validates and normalizes booking data to ensure it conforms to the expected structure
 * and data types. Throws an error if validation fails.
 *
 * @param data - The raw input data to be validated and normalized.
 * @returns The validated and normalized booking data in the `BookingDb` format.
 * @throws {@link AppError} If the input data is not structured as expected or validation fails.
 */
export function validateBooking(data: unknown): BookingDb {
    if (typeof data !== "object" || data === null) {
        throw appError(
            ERROR_DEFINITIONS.VALIDATION.A.CODE,
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
        // Rounded to 2 decimals here, not inside normalizeAmount: that helper
        // also normalizes cCount below, which is a share count, not a
        // currency amount, and must keep whatever precision it's given
        // (fractional fund shares). Rounding only the money fields closes the
        // import path for an unrounded amount (e.g. a hand-edited backup, or
        // a legacy pre-30 Credit/Debit pair whose difference isn't a clean
        // 2-decimal value) the same way CurrencyInput.vue's parseCurrency
        // now closes the form-entry path — this is the single point both
        // paths funnel through before a booking reaches the DB or the store.
        cDebit: round2(normalizeAmount(raw.cDebit)),
        cCredit: round2(normalizeAmount(raw.cCredit)),
        cDescription: normalizeString(raw.cDescription),
        cCount: normalizeAmount(raw.cCount),
        cBookingTypeID: Number(raw.cBookingTypeID ?? 0),
        cAccountNumberID: Number(raw.cAccountNumberID ?? 0),
        cStockID: Number(raw.cStockID ?? 0),
        cSoli: round2(normalizeSignedAmount(raw, "cSoli", "cSoliDebit", "cSoliCredit")),
        cTax: round2(normalizeSignedAmount(raw, "cTax", "cTaxDebit", "cTaxCredit")),
        cFee: round2(normalizeSignedAmount(raw, "cFee", "cFeeDebit", "cFeeCredit")),
        cSourceTax: round2(normalizeSignedAmount(raw, "cSourceTax", "cSourceTaxDebit", "cSourceTaxCredit")),
        cTransactionTax: round2(normalizeSignedAmount(
            raw,
            "cTransactionTax",
            "cTransactionTaxDebit",
            "cTransactionTaxCredit"
        )),
        cMarketPlace: normalizeString(raw.cMarketPlace)
    };

    // Domain rules
    if (normalized.cAccountNumberID === 0) {
        log(
            "DOMAIN VALIDATION validators: Booking missing account ID",
            normalized,
            "warn"
        );
    }

    return normalized;
}

/**
 * Validates and transforms the provided input data into a BookingTypeDb object.
 *
 * @param data - The input data to validate and transform. It is expected to be an object that conforms to the structure required by BookingTypeDb.
 * @returns Returns a transformed BookingTypeDb object if the input is valid. Throws an error if the input is invalid.
 */
export function validateBookingType(data: unknown): BookingTypeDb {
    if (typeof data !== "object" || data === null) {
        throw appError(
            ERROR_DEFINITIONS.VALIDATION.D.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
    const raw = data as Record<string, unknown>;
    const cID = Number(raw.cID ?? 0);
    const cName = normalizeBookingTypeName(normalizeString(raw.cName));
    return {
        cID,
        cName,
        cAccountNumberID: Number(raw.cAccountNumberID ?? 0),
        cRole: isValidRole(raw.cRole)
            ? raw.cRole
            : resolveLegacyBookingTypeRole(cID, cName)
    };
}

/**
 * Validates and normalizes stock data.
 *
 * @param data - The raw stock data to validate and normalize.
 * @returns The normalized and validated stock data in the expected format.
 * @throws {@link AppError} If the input data is not an object or validation fails.
 */
export function validateStock(data: unknown): StockRecord {
    if (typeof data !== "object" || data === null) {
        throw appError(
            ERROR_DEFINITIONS.VALIDATION.C.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
    const raw = data as Record<string, unknown>;

    const normalizedIsin = normalizeString(raw.cISIN);
    const isinRes = validateISIN(normalizedIsin);
    if (!isinRes.isValid) {
        log(
            "DOMAIN VALIDATION validators: Invalid ISIN",
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

/**
 * Converts the given input into a normalized numeric value.
 * If the input is not a finite number, defaults to 0.
 *
 * @param value - The input to be normalized, which can be of any type.
 * @returns The normalized numeric value or 0 if the input is not finite.
 */
function normalizeAmount(value: unknown): number {
    const num = toNumber(value as string | number);
    return Number.isFinite(num) ? num : 0;
}

/**
 * Normalizes one of the five signed tax/fee fields (schema 30: `cSoli`,
 * `cTax`, `cFee`, `cSourceTax`, `cTransactionTax`), accepting either the
 * current single-field shape or the pre-30 Credit/Debit pair it replaced.
 *
 * A backup file is versioned independently of the running app
 * (`MIN_SUPPORTED_VERSION` is 27), so a pre-30 export still carries the old
 * pair — collapsing it here the same way `formMapper.ts` does (`debit -
 * credit`, the two having always been mutually exclusive per booking) keeps
 * that data on import instead of silently dropping it to 0. The IndexedDB
 * migration path for an existing local database is separate — see
 * `migrator.ts`'s `collapseBookingCreditDebitFields`.
 *
 * @param raw - The raw booking record being normalized.
 * @param field - The current single-field name.
 * @param legacyDebitField - The pre-30 debit half of the pair.
 * @param legacyCreditField - The pre-30 credit half of the pair.
 * @returns The normalized signed amount.
 */
function normalizeSignedAmount(
    raw: Record<string, unknown>,
    field: string,
    legacyDebitField: string,
    legacyCreditField: string
): number {
    if (raw[field] !== undefined && raw[field] !== null) {
        return normalizeAmount(raw[field]);
    }
    return normalizeAmount(raw[legacyDebitField]) - normalizeAmount(raw[legacyCreditField]);
}

/**
 * Normalizes the provided value into an ISO 8601 date string. Accepts valid ISO date strings
 * or UNIX timestamp values and returns them in ISO 8601 format. Logs warnings for invalid input.
 *
 * @param value - The input value to normalize, which can be a string or a number.
 *                          Strings are evaluated to check if they are valid ISO date strings,
 *                          and numbers are treated as UNIX timestamps.
 * @returns Returns the normalized ISO 8601 date string if the input is valid.
 *                  Returns an empty string for invalid or unsupported values.
 */
function normalizeDate(value: unknown): string {
    if (typeof value === "string" && isValidISODate(value)) {
        return value;
    }
    if (typeof value === "number") {
        try {
            return isoDate(value);
        } catch (err) {
            log(
                "DOMAINS VALIDATION validators: Invalid numeric date value",
                {value, error: serializeError(err)},
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

/**
 * Normalizes the provided value by ensuring it is a string and trimming any leading or trailing whitespace.
 *
 * @param value - The value to be normalized.
 * @returns Returns the normalized string. If the input is not a string, an empty string is returned.
 */
function normalizeString(value: unknown): string {
    if (typeof value !== "string") return "";
    return value.trim();
}

