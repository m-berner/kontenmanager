/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

/**
 * Factory function to create swift rules.
 *
 * @param t - Localization function
 * @returns Array of swift validation messages
 */
export const createSwiftMessages = (t: (_key: string) => string): readonly string[] => Object.freeze(
    [
        t('validators.swiftRules.required'),
        t('validators.swiftRules.length'),
        t('validators.swiftRules.format'),
        t('validators.swiftRules.bankCode'),
        t('validators.swiftRules.countryCode'),
        t('validators.swiftRules.locationCode'),
        t('validators.swiftRules.branchCode'),
        t('validators.swiftRules.test')
    ]
)

/**
 * Factory function to create iban rules.
 *
 * @param t - Localization function
 * @returns Array of iban validation messages
 */
export const createIbanMessages = (t: (_key: string) => string): readonly string[] => Object.freeze(
    [
        t('validators.ibanRules.required'),
        t('validators.ibanRules.length'),
        t('validators.ibanRules.format'),
        t('validators.ibanRules.checksum'),
        t('validators.ibanRules.duplicate')
    ]
)
