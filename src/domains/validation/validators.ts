/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {ValidationRules} from './rules'
import {UtilsService} from '@/domains/utils'
import {AppError, ERROR_CATEGORY, ERROR_CODES} from '@/domains/errors'
import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from '@/types'

/**
 * Domain-specific validators that use the core ValidationRules.
 * These are used by business logic and database layers.
 */
export class DomainValidators {
    static validateBooking(data: unknown): BookingDb {
        if (typeof data !== 'object' || data === null) {
            throw new AppError(
                ERROR_CODES.VALIDATION.A,
                ERROR_CATEGORY.VALIDATION,
                {input: data, entity: 'booking'},
                false
            )
        }

        const raw = data as Record<string, unknown>

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
        }

        // Domain rules
        if (normalized.cAccountNumberID === 0) {
            UtilsService.log('DomainValidators: Booking missing account ID', normalized, 'warn')
        }

        return normalized
    }

    static validateAccount(data: unknown): AccountDb {
        if (typeof data !== 'object' || data === null) {
            throw new AppError(
                ERROR_CODES.VALIDATION.B,
                ERROR_CATEGORY.VALIDATION,
                {input: data, entity: 'account'},
                false
            )
        }
        const raw = data as Record<string, any>

        const ibanRes = ValidationRules.validateIBAN(raw.cIban)
        if (!ibanRes.isValid) {
            UtilsService.log('DomainValidators: Invalid IBAN', raw.cIban, 'warn')
        }

        return {
            cID: Number(raw.cID ?? 0),
            cSwift: this.normalizeString(raw.cSwift).toUpperCase(),
            cIban: this.normalizeString(raw.cIban).replace(/\s/g, '').toUpperCase(),
            cLogoUrl: this.normalizeString(raw.cLogoUrl),
            cWithDepot: Boolean(raw.cWithDepot)
        }
    }

    static validateStock(data: unknown): StockDb {
        if (typeof data !== 'object' || data === null) {
            throw new AppError(
                ERROR_CODES.VALIDATION.C,
                ERROR_CATEGORY.VALIDATION,
                {input: data, entity: 'stock'},
                false
            )
        }
        const raw = data as Record<string, any>

        const isinRes = ValidationRules.validateISIN(raw.cISIN)
        if (!isinRes.isValid) {
            UtilsService.log('DomainValidators: Invalid ISIN', raw.cISIN, 'warn')
        }

        return {
            cID: Number(raw.cID ?? 0),
            cCompany: this.normalizeString(raw.cCompany),
            cISIN: this.normalizeString(raw.cISIN).replace(/\s/g, '').toUpperCase(),
            cSymbol: this.normalizeString(raw.cSymbol).toUpperCase(),
            cFirstPage: Number(raw.cFirstPage ?? 0),
            cFadeOut: Number(raw.cFadeOut ?? 0),
            cMeetingDay: this.normalizeString(raw.cMeetingDay),
            cQuarterDay: this.normalizeString(raw.cQuarterDay),
            cURL: this.normalizeString(raw.cURL),
            cAccountNumberID: Number(raw.cAccountNumberID ?? 0),
            cAskDates: this.normalizeString(raw.cAskDates)
        }
    }

    static validateBookingType(data: unknown): BookingTypeDb {
        if (typeof data !== 'object' || data === null) {
            throw new AppError(
                ERROR_CODES.VALIDATION.D,
                ERROR_CATEGORY.VALIDATION,
                {input: data, entity: 'bookingType'},
                false
            )
        }
        const raw = data as Record<string, any>
        return {
            cID: Number(raw.cID ?? 0),
            cName: UtilsService.normalizeBookingTypeName(this.normalizeString(raw.cName)),
            cAccountNumberID: Number(raw.cAccountNumberID ?? 0)
        }
    }

    private static normalizeString(value: unknown): string {
        if (typeof value !== 'string') return ''
        return value.trim()
    }

    private static normalizeAmount(value: unknown): number {
        const num = UtilsService.toNumber(value as string | number)
        return isFinite(num) ? num : 0
    }

    private static normalizeDate(value: unknown): string {
        if (typeof value === 'string' && UtilsService.isValidISODate(value)) {
            return value
        }
        if (typeof value === 'number') {
            try {
                return UtilsService.isoDate(value)
            } catch {
                // Fallback
            }
        }
        return new Date().toISOString().substring(0, 10)
    }
}
