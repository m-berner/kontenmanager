/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {
    I_Account_DB,
    I_Backup,
    I_Backup_Validation,
    I_Booking_DB,
    I_Booking_SM,
    I_Booking_Type_DB,
    I_Legacy_Stock,
    I_Metadata,
    I_Stock_DB
} from '@/types'
import type {I_DATE} from '@/configurations/date'
import type {I_INDEXED_DB} from '@/configurations/indexed_db'
import {INDEXED_DB} from '@/configurations/indexed_db'

export function useImportExport() {

    class ImportExportService {
        constructor(
            private readonly _INDEXED_DB: I_INDEXED_DB,
            private readonly _DATE: I_DATE,
            private readonly _isoDate: (_date: number) => string
        ) {
        }

        verifyExportIntegrity(exportedData: string): { valid: boolean; errors: string[] } {
            try {
                const parsed = JSON.parse(exportedData)
                const validation = validateBackup(parsed)

                if (!validation.isValid) {
                    return {
                        valid: false,
                        errors: [validation.error || 'Unknown validation error']
                    }
                }

                // Additional integrity checks
                const integrityErrors = this.validateDataIntegrity(parsed)

                return {
                    valid: integrityErrors.length === 0,
                    errors: integrityErrors
                }
            } catch (err) {
                return {
                    valid: false,
                    errors: [(err as Error).message]
                }
            }
        }

        validateDataIntegrity(backup: I_Backup): string[] {
            const errors: string[] = []

            // Null/undefined safety checks
            if (!backup.accounts || !backup.stocks || !backup.bookings || !backup.bookingTypes) {
                errors.push('Missing required data arrays')
                return errors
            }
            // Check for undefined IDs
            const undefinedAccountIds = backup.accounts.filter(a => a.cID === undefined).length
            if (undefinedAccountIds > 0) {
                errors.push(`${undefinedAccountIds} accounts have undefined IDs`)
            }

            const undefinedStockIds = backup.stocks.filter(s => s.cID === undefined).length
            if (undefinedStockIds > 0) {
                errors.push(`${undefinedStockIds} stocks have undefined IDs`)
            }

            const undefinedBookingIds = backup.bookings.filter(b => b.cID === undefined).length
            if (undefinedBookingIds > 0) {
                errors.push(`${undefinedBookingIds} bookings have undefined IDs`)
            }
            // Check foreign key relationships
            const accountIds = new Set(backup.accounts.map(a => a.cID))
            const stockIds = new Set(backup.stocks.map(s => s.cID))
            const bookingTypeIds = new Set(backup.bookingTypes.map(bt => bt.cID))

            // Validate bookings
            for (const booking of backup.bookings) {
                if (!accountIds.has(booking.cAccountNumberID)) {
                    errors.push(`Booking ${booking.cID} references non-existent account ${booking.cAccountNumberID}`)
                }

                if (booking.cStockID && !stockIds.has(booking.cStockID)) {
                    errors.push(`Booking ${booking.cID} references non-existent stock ${booking.cStockID}`)
                }

                if (!bookingTypeIds.has(booking.cBookingTypeID)) {
                    errors.push(`Booking ${booking.cID} references non-existent booking type ${booking.cBookingTypeID}`)
                }

                // Validate amounts
                if (booking.cCredit < 0 || booking.cDebit < 0) {
                    errors.push(`Booking ${booking.cID} has negative credit/debit values`)
                }

                // Both credit and debit should not be positive at the same time
                if (booking.cCredit > 0 && booking.cDebit > 0) {
                    errors.push(`Booking ${booking.cID} has both credit and debit values`)
                }
            }

            // Validate stocks
            for (const stock of backup.stocks) {
                if (!accountIds.has(stock.cAccountNumberID)) {
                    errors.push(`Stock ${stock.cID} references non-existent account ${stock.cAccountNumberID}`)
                }
            }

            // Validate booking types
            for (const bt of backup.bookingTypes) {
                if (!accountIds.has(bt.cAccountNumberID)) {
                    errors.push(`Booking type ${bt.cID} references non-existent account ${bt.cAccountNumberID}`)
                }
            }

            // Check for duplicate IDs
            const duplicateAccounts = this.findDuplicates(backup.accounts.map(a => a.cID).filter((id): id is number => id !== undefined))
            if (duplicateAccounts.length > 0) {
                errors.push(`Duplicate account IDs: ${duplicateAccounts.join(', ')}`)
            }

            const duplicateStocks = this.findDuplicates(backup.stocks.map(s => s.cID).filter((id): id is number => id !== undefined))
            if (duplicateStocks.length > 0) {
                errors.push(`Duplicate stock IDs: ${duplicateStocks.join(', ')}`)
            }

            const duplicateBookings = this.findDuplicates(backup.bookings.map(b => b.cID).filter((id): id is number => id !== undefined))
            if (duplicateBookings.length > 0) {
                errors.push(`Duplicate booking IDs: ${duplicateBookings.join(', ')}`)
            }

            return errors
        }

        validateLegacyDataIntegrity(backup: I_Backup): string[] {
            const errors: string[] = []

            if (!backup.stocks || !backup.transfers) {
                errors.push('Missing required legacy data arrays')
                return errors
            }

            // Check for duplicate IDs in legacy data
            const duplicateStocks = this.findDuplicates(backup.stocks.map(s => s.cID).filter((id): id is number => id !== undefined))
            if (duplicateStocks.length > 0) {
                errors.push(`Duplicate stock IDs: ${duplicateStocks.join(', ')}`)
            }

            // Validate transfers reference valid stocks
            const stockIds = new Set(backup.stocks.map(s => s.cID))
            for (let i = 0; i < backup.transfers.length; i++) {
                const transfer = backup.transfers[i]
                if (transfer.cStockID && !stockIds.has(transfer.cStockID)) {
                    errors.push(`Transfer ${i + 1} references non-existent stock ${transfer.cStockID}`)
                }
            }

            return errors
        }

        transformLegacyStock(rec: I_Legacy_Stock, activeId: number): I_Stock_DB {
            return {
                cID: rec.cID,
                cAccountNumberID: activeId,
                cSymbol: rec.cSym,
                cMeetingDay: this._isoDate(rec.cMeetingDay),
                cQuarterDay: this._isoDate(rec.cQuarterDay),
                cCompany: rec.cCompany,
                cISIN: rec.cISIN,
                cFadeOut: rec.cFadeOut,
                cFirstPage: rec.cFirstPage,
                cURL: rec.cURL,
                cAskDates: this._DATE.ISO
            } as I_Stock_DB
        }

        transformLegacyBooking(
            smTransfer: I_Booking_SM,
            index: number,
            activeId: number
        ): I_Booking_DB {
            const BOOKING_TYPES = this._INDEXED_DB.STORE.BOOKING_TYPES
            const booking: I_Booking_DB = {
                cID: index + 1,
                cAccountNumberID: activeId,
                cStockID: smTransfer.cStockID,
                cBookDate: this._isoDate(smTransfer.cDate),
                cBookingTypeID: smTransfer.cType,
                cExDate: this._isoDate(smTransfer.cExDay),
                cCount: Math.abs(smTransfer.cCount),
                cDescription: smTransfer.cDescription,
                cMarketPlace: smTransfer.cMarketPlace,
                cTransactionTaxCredit: smTransfer.cFTax > 0 ? smTransfer.cFTax : 0,
                cTransactionTaxDebit: smTransfer.cFTax < 0 ? -smTransfer.cFTax : 0,
                cSourceTaxCredit: smTransfer.cSTax > 0 ? smTransfer.cSTax : 0,
                cSourceTaxDebit: smTransfer.cSTax < 0 ? -smTransfer.cSTax : 0,
                cFeeCredit: smTransfer.cFees > 0 ? smTransfer.cFees : 0,
                cFeeDebit: smTransfer.cFees < 0 ? -smTransfer.cFees : 0,
                cTaxCredit: smTransfer.cTax > 0 ? smTransfer.cTax : 0,
                cTaxDebit: smTransfer.cTax < 0 ? -smTransfer.cTax : 0,
                cSoliCredit: smTransfer.cSoli > 0 ? smTransfer.cSoli : 0,
                cSoliDebit: smTransfer.cSoli < 0 ? -smTransfer.cSoli : 0,
                cCredit: smTransfer.cAmount > 0 ? smTransfer.cAmount : 0,
                cDebit: smTransfer.cAmount < 0 ? -smTransfer.cAmount : 0
            }

            // Apply type-specific transformations
            const creditDebit = this.createCreditDebitObject(smTransfer)

            switch (smTransfer.cType) {
                case BOOKING_TYPES.BUY:
                    booking.cDebit = creditDebit.value
                    booking.cCredit = 0
                    break
                case BOOKING_TYPES.SELL:
                case BOOKING_TYPES.DIVIDEND:
                    booking.cCredit = creditDebit.value
                    booking.cDebit = 0
                    break
                case BOOKING_TYPES.CREDIT:
                    this.resetTaxesAndFees(booking)
                    booking.cBookingTypeID = creditDebit.type
                    booking.cCredit = creditDebit.value
                    booking.cDebit = 0
                    break
                case BOOKING_TYPES.DEBIT:
                    this.resetTaxesAndFees(booking)
                    booking.cBookingTypeID = creditDebit.type
                    booking.cCredit = 0
                    booking.cDebit = creditDebit.value
                    break
                default:
                    throw new Error(`Unknown booking type: ${smTransfer.cType}`)
            }

            return booking
        }

        stringifyDatabase(
            sm: I_Metadata,
            accounts: I_Account_DB[],
            stocks: I_Stock_DB[],
            bookingTypes: I_Booking_Type_DB[],
            bookings: I_Booking_DB[]
        ): string {
            if (!accounts || !Array.isArray(accounts)) {
                throw new Error('Invalid accounts data')
            }
            if (!stocks || !Array.isArray(stocks)) {
                throw new Error('Invalid stocks data')
            }
            if (!bookingTypes || !Array.isArray(bookingTypes)) {
                throw new Error('Invalid booking types data')
            }
            if (!bookings || !Array.isArray(bookings)) {
                throw new Error('Invalid bookings data')
            }

            const exportData = {
                sm,
                accounts,
                stocks,
                bookingTypes,
                bookings
            }
            try {
                return JSON.stringify(exportData, null, 2)
            } catch (err) {
                throw new Error(`Failed to serialize data: ${(err as Error).message}`)
            }
        }

        private findDuplicates(arr: number[]): number[] {
            const seen = new Set<number>()
            const duplicates = new Set<number>()

            for (const id of arr) {
                if (seen.has(id)) {
                    duplicates.add(id)
                }
                seen.add(id)
            }

            return Array.from(duplicates)
        }

        private createCreditDebitObject(rec: I_Booking_SM): { value: number; type: number } {
            const BOOKING_TYPES = this._INDEXED_DB.STORE.BOOKING_TYPES
            const result = {value: 0, type: -1}

            // Determine non-zero fields (types 4, 5) and recreate type
            // Types 1-3 will be overwritten in the next step
            if (rec.cAmount !== 0) {
                result.type = BOOKING_TYPES.OTHER
            } else if (rec.cFees !== 0) {
                result.type = BOOKING_TYPES.FEE
            } else if (rec.cTax !== 0 || rec.cSoli !== 0 || rec.cSTax !== 0 || rec.cFTax !== 0) {
                result.type = BOOKING_TYPES.TAX
            }

            // Select by type and create value
            if (rec.cType === BOOKING_TYPES.BUY) {
                return {value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.BUY}
            }
            if (rec.cType === BOOKING_TYPES.SELL) {
                return {value: rec.cUnitQuotation * -rec.cCount, type: BOOKING_TYPES.SELL}
            }
            if (rec.cType === BOOKING_TYPES.DIVIDEND) {
                return {value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.DIVIDEND}
            }
            if (rec.cType === BOOKING_TYPES.CREDIT) {
                result.value = rec.cAmount + rec.cFees + rec.cSTax + rec.cFTax + rec.cTax + rec.cSoli
                return result
            }
            if (rec.cType === BOOKING_TYPES.DEBIT) {
                result.value = -rec.cAmount - rec.cFees - rec.cSTax - rec.cFTax - rec.cTax - rec.cSoli
                return result
            }

            throw new Error(`Unknown booking type: ${rec.cType}`)
        }

        private resetTaxesAndFees(booking: Partial<I_Booking_DB>): void {
            booking.cFeeCredit = 0
            booking.cFeeDebit = 0
            booking.cTransactionTaxCredit = 0
            booking.cTransactionTaxDebit = 0
            booking.cSourceTaxCredit = 0
            booking.cSourceTaxDebit = 0
            booking.cTaxCredit = 0
            booking.cTaxDebit = 0
            booking.cSoliCredit = 0
            booking.cSoliDebit = 0
        }
    }

    function validateBackup(data: unknown): I_Backup_Validation {
        if (!data || typeof data !== 'object') {
            return {isValid: false, version: -1, error: 'Invalid data format'}
        }

        const backup = data as Partial<I_Backup>

        if (!backup.sm?.cDBVersion) {
            return {isValid: false, version: -1, error: 'Missing version information'}
        }

        if (backup.sm.cDBVersion < INDEXED_DB.SM_IMPORT_VERSION) {
            return {isValid: false, version: backup.sm.cDBVersion, error: 'Version too old'}
        }

        // Check for required fields
        const isLegacy = backup.sm.cDBVersion === INDEXED_DB.SM_IMPORT_VERSION

        if (isLegacy) {
            if (!backup.stocks || !Array.isArray(backup.stocks)) {
                return {isValid: false, version: backup.sm.cDBVersion, error: 'Missing or invalid stocks data'}
            }
            if (!backup.transfers || !Array.isArray(backup.transfers)) {
                return {isValid: false, version: backup.sm.cDBVersion, error: 'Missing or invalid transfers data'}
            }
        } else {
            const requiredFields = [
                {field: backup.accounts, name: 'accounts'},
                {field: backup.stocks, name: 'stocks'},
                {field: backup.bookingTypes, name: 'bookingTypes'},
                {field: backup.bookings, name: 'bookings'}
            ]

            for (const {field, name} of requiredFields) {
                if (!field || !Array.isArray(field)) {
                    return {isValid: false, version: backup.sm.cDBVersion, error: `Missing or invalid ${name} data`}
                }
            }
        }

        return {isValid: true, version: backup.sm.cDBVersion}
    }

    async function readJsonFile(blob: Blob): Promise<I_Backup> {
        if (!blob || blob.size === 0) {
            throw new Error('Empty or invalid file')
        }

        let text: string
        try {
            text = await blob.text()
        } catch (err) {
            if (err instanceof SyntaxError) {
                throw new Error(`Invalid JSON format: ${err.message}`)
            }
            throw err
        }

        if (!text || text.trim().length === 0) {
            throw new Error('File contains no data')
        }

        let parsed: I_Backup
        try {
            parsed = JSON.parse(text)
        } catch (err) {
            if (err instanceof SyntaxError) {
                throw new Error(`Invalid JSON format: ${err.message}`)
            }
            throw err
        }

        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid JSON structure')
        }

        return parsed
    }

    return {
        ImportExportService,
        readJsonFile,
        validateBackup
    }
}
