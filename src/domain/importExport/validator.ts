/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {BOOKING_TYPE_ROLE, INDEXED_DB} from "@/domain/constants";
import type {BackupData, BackupValidationResult, ModernBackupData} from "@/domain/types";
import {
    describeReferentialIssues,
    findReferentialIssues
} from "@/domain/validation/referentialIntegrity";
import {resolveLegacyBookingTypeRole} from "@/domain/validation/validators";

const VALID_ROLES: string[] = Object.values(BOOKING_TYPE_ROLE);

/**
 * Performs a high-level validation of the backup data format and version.
 */
export function validateBackup(data: unknown): BackupValidationResult {
    if (!data || typeof data !== "object") {
        return {isValid: false, version: -1, error: "Invalid data format"};
    }

    const base = data as { sm?: { cDBVersion?: number } } & Record<string, unknown>;

    // Nullish rather than truthy: a literal `cDBVersion: 0` is *present* but
    // unsupported, and the truthiness test sent it down this branch, reporting
    // "Missing version information" for a backup that carries a version. The
    // import was rejected either way (0 < MIN_SUPPORTED_VERSION), but with a
    // reason that pointed at the wrong problem. Same truthy-vs-nullish shape
    // `aggregateBookingsPerType` calls out in its own comment for `year`.
    if (base.sm?.cDBVersion === undefined || base.sm.cDBVersion === null) {
        return {
            isValid: false,
            version: -1,
            error: "Missing version information"
        };
    }

    if (typeof base.sm.cDBVersion !== "number" || !Number.isFinite(base.sm.cDBVersion)) {
        return {
            isValid: false,
            version: -1,
            error: "Invalid version information"
        };
    }

    if (base.sm.cDBVersion < INDEXED_DB.MIN_SUPPORTED_VERSION) {
        return {
            isValid: false,
            version: base.sm.cDBVersion,
            error: `Version ${base.sm.cDBVersion} is too old (minimum: ${INDEXED_DB.MIN_SUPPORTED_VERSION})`
        };
    }

    const modern = data as Partial<ModernBackupData>;
    const requiredFields = [
        {field: modern.accounts, name: "accounts"},
        {field: modern.stocks, name: "stocks"},
        {field: modern.bookingTypes, name: "bookingTypes"},
        {field: modern.bookings, name: "bookings"}
    ];

    for (const {field, name} of requiredFields) {
        const validation = isArrayField(field, base.sm.cDBVersion, name);
        if (validation) return validation;
    }

    return {isValid: true, version: base.sm.cDBVersion};
}

/**
 * Validates the integrity of backup data by checking for missing required data arrays,
 * undefined IDs, foreign key relationships, duplicate IDs, and adherence to business rules.
 *
 * @param backup - The backup data object containing accounts, stocks, bookings, and booking types to validate.
 * @returns An array of error messages describing any issues found during validation. Returns an empty array if no issues are detected.
 */
export function validateDataIntegrity(backup: BackupData): string[] {
    const errors: string[] = [];

    if (
        !backup.accounts ||
        !backup.stocks ||
        !backup.bookings ||
        !backup.bookingTypes
    ) {
        return ["Missing required data arrays"];
    }

    errors.push(...checkUndefinedIds(backup));
    errors.push(...validateForeignKeys(backup));
    errors.push(...checkDuplicateIds(backup));
    errors.push(...checkDuplicateBookingTypeRoles(backup));
    errors.push(...validateBusinessRules(backup));

    return errors;
}

/**
 * Identifies accounts that have more than one booking type sharing the same
 * buy/sell/dividend role. `resolveTypeIdByRole` (domain/logic.ts) picks the
 * first match for a role only, so a second same-role type's bookings would be
 * silently excluded from that role's portfolio/invest/dividend calculations —
 * a wrong financial figure with no error shown. `"other"` is excluded since
 * multiple custom (non-role) types are expected and never resolved by role.
 *
 * Runs on the raw, not-yet-normalized backup (validateDataIntegrity is called
 * before normalizeModernBackup), so a row missing/invalid `cRole` (a backup
 * exported before this field existed) is resolved with the same best-effort
 * fallback `validateBookingType` itself uses later, so this check catches a
 * role collision caused by the legacy name-matching fallback too, not just an
 * explicit duplicate `cRole` in a hand-edited modern backup.
 *
 * @param backup - The backup data object containing booking types.
 * @returns An array of error messages, one per account+role with more than one match.
 */
function checkDuplicateBookingTypeRoles(backup: ModernBackupData): string[] {
    const errors: string[] = [];
    const roleCountsByAccount = new Map<number, Map<string, number>>();

    for (const bt of backup.bookingTypes) {
        const role = typeof bt.cRole === "string" && VALID_ROLES.includes(bt.cRole)
            ? bt.cRole
            : resolveLegacyBookingTypeRole(bt.cID, typeof bt.cName === "string" ? bt.cName : "");
        if (role === BOOKING_TYPE_ROLE.OTHER) continue;

        const roleCounts = roleCountsByAccount.get(bt.cAccountNumberID) ?? new Map<string, number>();
        roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
        roleCountsByAccount.set(bt.cAccountNumberID, roleCounts);
    }

    for (const [accountId, roleCounts] of roleCountsByAccount) {
        for (const [role, count] of roleCounts) {
            if (count > 1) {
                errors.push(`Account ${accountId} has ${count} booking types with role "${role}"`);
            }
        }
    }

    return errors;
}

/**
 * Identifies and collects errors for duplicate IDs found in the accounts, stocks, and bookings
 * sections of the provided backup data.
 *
 * @param backup - The backup data object containing accounts, stocks, and bookings.
 * @returns An array of error messages indicating the duplicates found for each section.
 */
function checkDuplicateIds(backup: ModernBackupData): string[] {
    const errors: string[] = [];
    pushDuplicateIdError(
        errors,
        findDuplicates(collectDefinedIds(backup.accounts)),
        "account"
    );
    pushDuplicateIdError(
        errors,
        findDuplicates(collectDefinedIds(backup.stocks)),
        "stock"
    );
    pushDuplicateIdError(
        errors,
        findDuplicates(collectDefinedIds(backup.bookingTypes)),
        "booking type"
    );
    pushDuplicateIdError(
        errors,
        findDuplicates(collectDefinedIds(backup.bookings)),
        "booking"
    );
    return errors;
}

/**
 * Checks for undefined IDs in various sections of the given backup data and returns a list of error messages.
 *
 * @param backup - The backup data object containing various sections such as accounts, stocks, and bookings.
 * @returns An array of error messages indicating the sections with undefined IDs, if any.
 */
function checkUndefinedIds(backup: ModernBackupData): string[] {
    const errors: string[] = [];
    pushUndefinedIdError(
        errors,
        countUndefinedIds(backup.accounts),
        "accounts"
    );
    pushUndefinedIdError(
        errors,
        countUndefinedIds(backup.stocks),
        "stocks"
    );
    pushUndefinedIdError(
        errors,
        countUndefinedIds(backup.bookingTypes),
        "bookingTypes"
    );
    pushUndefinedIdError(
        errors,
        countUndefinedIds(backup.bookings),
        "bookings"
    );
    return errors;
}

/**
 * Collects and returns an array of defined `cID` values from the provided array of objects.
 *
 * @param items - An array of objects, where each object may optionally contain a `cID` property.
 * @returns An array of `cID` values that are defined (not `undefined`) in the input objects.
 */
function collectDefinedIds<T extends { cID?: number }>(
    items: T[]
): number[] {
    return items
        .map((item) => item.cID)
        .filter((id): id is number => id !== undefined);
}

/**
 * Counts the number of objects in the array where the `cID` property is undefined or null.
 * `null` is treated the same as `undefined`: downstream normalizers disagree on how to
 * default a missing `cID` (e.g. `validateAccount` uses `?? 0`, `import.ts`'s active-account
 * fallback uses `?? SM_RESTORE_ACCOUNT_ID`), so letting a `null` cID slip past this check
 * can desync which account id the post-import UI filters by from what was actually written
 * to the database.
 *
 * @param items - An array of objects to be checked. Each object may optionally have a `cID` property.
 * @returns The count of objects with a missing `cID` property.
 */
function countUndefinedIds<T extends { cID?: number | null }>(items: T[]): number {
    return items.filter((item) => item.cID === undefined || item.cID === null).length;
}

/**
 * Identifies and returns duplicate numbers in an array.
 *
 * @param arr - The array of numbers to check for duplicates.
 * @returns An array containing the duplicate numbers found in the input array.
 */
function findDuplicates(arr: number[]): number[] {
    const seen = new Set<number>();
    const duplicates = new Set<number>();
    for (const id of arr) {
        if (seen.has(id)) duplicates.add(id);
        seen.add(id);
    }
    return Array.from(duplicates);
}

/**
 * Checks whether the provided field is an array and validates it.
 *
 * @param field - The field to be checked and validated.
 * @param version - The version number associated with the validation.
 * @param name - The name of the field being validated, used in error messages.
 * @returns Returns a validation result object if the field is not an array, or null if the field is valid.
 */
function isArrayField(
    field: unknown,
    version: number,
    name: string
): BackupValidationResult | null {
    if (!Array.isArray(field)) {
        return {
            isValid: false,
            version,
            error: `Missing or invalid ${name} data`
        };
    }
    return null;
}

/**
 * Appends a descriptive error message to the list of errors when duplicate IDs are detected.
 *
 * @param errors - The array that stores error messages.
 * @param ids - The list of duplicate IDs to include in the error message.
 * @param entityName - The name of the entity associated with the duplicate IDs.
 * @returns This function does not return a value; it modifies the `errors` array directly.
 */
function pushDuplicateIdError(
    errors: string[],
    ids: number[],
    entityName: string
): void {
    if (ids.length > 0) {
        errors.push(`Duplicate ${entityName} IDs: ${ids.join(", ")}`);
    }
}

/**
 * Pushes an error message into the error array if the specified count is greater than zero.
 *
 * @param errors - The array to which the error message will be added.
 * @param count - The number of entities with undefined IDs.
 * @param entityName - The name of the entity type associated with the undefined IDs.
 * @returns This method does not return any value.
 */
function pushUndefinedIdError(
    errors: string[],
    count: number,
    entityName: string
): void {
    if (count > 0) {
        errors.push(`${count} ${entityName} have undefined IDs`);
    }
}

/**
 * Validates the business rules for the provided backup data and ensures that
 * the credit and debit values in the bookings adhere to the specified criteria.
 *
 * @param backup - The backup data containing the bookings to validate.
 * @returns An array of error messages indicating the business rule violations.
 */
function validateBusinessRules(backup: ModernBackupData): string[] {
    const errors: string[] = [];

    // Every sign check below is of the form `field < 0`, which is `false` for a
    // value that isn't a number at all (`undefined < 0`, `"abc" < 0`). So a
    // hand-edited backup carrying a string or null amount slipped past every
    // check and was later coerced to 0 by validateBooking's normalizeAmount.
    //
    // Only values that are PRESENT but not a finite number are flagged. An
    // absent field is deliberately tolerated: MIN_SUPPORTED_VERSION is 27 and
    // fields have been added since, so a legitimate older export can be missing
    // one, and normalizeAmount's 0 default is the right answer there. Rejecting
    // those outright would block importing valid backups — a worse failure than
    // the one this guards against.
    //
    // `cSoli`/`cTax`/`cFee`/`cSourceTax`/`cTransactionTax` are signed (schema
    // 30): a negative value legitimately represents the credit/refund side —
    // it's what a Credit/Debit pair collapses to (`formMapper.ts`) — so unlike
    // `cCredit`/`cDebit` there is no sign to reject here, only "is it a
    // finite number at all".
    const amountFields = [
        "cCredit", "cDebit",
        "cSoli", "cTax", "cFee", "cSourceTax", "cTransactionTax",
        "cCount"
    ] as const;

    for (const booking of backup.bookings) {
        const record = booking as unknown as Record<string, unknown>;
        const malformed = amountFields.filter((field) => {
            const value = record[field];
            if (value === undefined || value === null) return false; // absent: tolerated
            return typeof value !== "number" || !Number.isFinite(value);
        });
        if (malformed.length > 0) {
            errors.push(
                `Booking ${booking.cID} has non-numeric values: ${malformed.join(", ")}`
            );
        }

        if (booking.cCredit < 0 || booking.cDebit < 0)
            errors.push(`Booking ${booking.cID} has negative credit/debit values`);
        if (booking.cCredit > 0 && booking.cDebit > 0)
            errors.push(`Booking ${booking.cID} has positive credit/debit values`);
        // Mirrors the UI-form countRules() guard (adapters/ui/validationAdapter.ts) at
        // the backup-import boundary: a negative count silently inverts
        // calculatePortfolioByStockId's buy/sell math for hand-edited/legacy backups.
        if (booking.cCount < 0)
            errors.push(`Booking ${booking.cID} has a negative count`);
    }
    return errors;
}

/**
 * Validates foreign key references in the provided backup data.
 * Ensures that all bookings, stocks, and booking types reference valid accounts,
 * and that bookings reference valid stocks and booking types where applicable.
 *
 * @param backup - The backup data object containing accounts, stocks, booking types, and bookings.
 * @returns An array of error messages describing invalid foreign key references, if any are found.
 */
function validateForeignKeys(backup: ModernBackupData): string[] {
    // Delegates to the shared survey in `domain/validation/referentialIntegrity`,
    // which the export path and the health checker now also use. This function
    // was the strictest of the three hand-written traversals and is what the
    // other two were reconciled *to* — see that module's comment.
    return describeReferentialIssues(findReferentialIssues(backup));
}