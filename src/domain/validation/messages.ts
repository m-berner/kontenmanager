/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * Factory function to create iban rules.
 *
 * @param t - Localization function
 * @returns Array of iban validation messages
 */
export const createIbanMessages = (
    t: (_key: string) => string
): readonly string[] =>
    [
        t("validators.ibanRules.required"),
        t("validators.ibanRules.length"),
        t("validators.ibanRules.format"),
        t("validators.ibanRules.checksum"),
        t("validators.ibanRules.duplicate")
    ] as const;

/**
 * Factory function to create swift rules.
 *
 * One entry per outcome `validateSWIFT` can actually return. It used to
 * allocate eight, five of which (bankCode, countryCode, locationCode,
 * branchCode, test) were wired to validator codes that no input could produce —
 * see the note in `domain/validation/rules.ts`. The corresponding locale keys
 * were removed with them.
 *
 * @param t - Localization function
 * @returns Array of swift validation messages
 */
export const createSwiftMessages = (
    t: (_key: string) => string
): readonly string[] =>
    [
        t("validators.swiftRules.required"),
        t("validators.swiftRules.length"),
        t("validators.swiftRules.format")
    ] as const;
