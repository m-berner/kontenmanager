/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {
    AccountDb,
    AppMetadata,
    BackupData,
    BackupValidationResult,
    BookingDb,
    BookingTypeDb,
    LegacyBookingDb,
    LegacyStockDb,
    StockDb
} from '@/types'
import {AppError} from '@/domains/errors'
import {UtilsService} from '@/domains/utils'
import {INDEXED_DB} from '@/config/database'
import {SYSTEM} from '@/domains/config/system'

import {ImportExportValidator} from '@/domains/importExport/validator'
import {ImportExportTransformer} from '@/domains/importExport/transformer'
import {DATE} from '@/domains/config/date'

export class ImportExportService {
    private readonly _transformer: ImportExportTransformer

    constructor() {
        this._transformer = new ImportExportTransformer(INDEXED_DB, DATE, UtilsService.isoDate)
    }

    static validateBackup(data: unknown): BackupValidationResult {
        return ImportExportValidator.validateBackup(data)
    }

    static async readJsonFile(blob: Blob): Promise<BackupData> {
        if (!blob || blob.size === 0) {
            throw new AppError(
                'Empty or invalid file',
                'EMPTY_FILE',
                SYSTEM.ERROR_CATEGORY.VALIDATION,
                {},
                false
            )
        }

        // Size check (e.g., max 100MB)
        const MAX_SIZE = 100 * 1024 * 1024
        if (blob.size > MAX_SIZE) {
            throw new AppError(
                'File too large',
                'FILE_TOO_LARGE',
                SYSTEM.ERROR_CATEGORY.VALIDATION,
                {size: blob.size, maxSize: MAX_SIZE},
                false
            )
        }

        let text: string
        try {
            text = await blob.text()
        } catch (err) {
            throw new AppError(
                'Failed to read file',
                'READ_FAILED',
                SYSTEM.ERROR_CATEGORY.VALIDATION,
                {originalError: err},
                true
            )
        }

        if (!text || text.trim().length === 0) {
            throw new AppError(
                'File contains no data',
                'NO_DATA',
                SYSTEM.ERROR_CATEGORY.VALIDATION,
                {},
                false
            )
        }

        let parsed: BackupData
        try {
            parsed = JSON.parse(text)
        } catch (err) {
            if (err instanceof SyntaxError) {
                throw new AppError(
                    `Invalid JSON format: ${err.message}`,
                    'INVALID_JSON',
                    SYSTEM.ERROR_CATEGORY.VALIDATION,
                    {originalError: err},
                    true
                )
            }
            throw err
        }

        if (!parsed || typeof parsed !== 'object') {
            throw new AppError(
                'Invalid JSON structure',
                'INVALID_STRUCTURE',
                SYSTEM.ERROR_CATEGORY.VALIDATION,
                {},
                false
            )
        }

        return parsed
    }

    stringifyDatabase(
        sm: AppMetadata,
        accounts: AccountDb[],
        stocks: StockDb[],
        bookingTypes: BookingTypeDb[],
        bookings: BookingDb[]
    ): string {
        this.validateExportData(accounts, stocks, bookingTypes, bookings)

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
            throw new AppError(
                'Failed to serialize data',
                'SERIALIZE_FAILED',
                SYSTEM.ERROR_CATEGORY.VALIDATION,
                {originalError: err},
                true
            )
        }
    }

    verifyExportIntegrity(exportedData: string): { valid: boolean; errors: string[] } {
        try {
            const parsed = JSON.parse(exportedData)
            const validation = ImportExportValidator.validateBackup(parsed)

            if (!validation.isValid) {
                return {
                    valid: false,
                    errors: [validation.error || 'Unknown validation error']
                }
            }

            // Additional integrity checks
            const integrityErrors = ImportExportValidator.validateDataIntegrity(parsed)

            return {
                valid: integrityErrors.length === 0,
                errors: integrityErrors
            }
        } catch (err) {
            return {
                valid: false,
                errors: [`Parse error: ${(err as Error).message}`]
            }
        }
    }

    validateDataIntegrity(backup: BackupData): string[] {
        return ImportExportValidator.validateDataIntegrity(backup)
    }

    validateLegacyDataIntegrity(backup: BackupData): string[] {
        return ImportExportValidator.validateLegacyDataIntegrity(backup)
    }

    transformLegacyStock(rec: LegacyStockDb, activeId: number): StockDb {
        return this._transformer.transformLegacyStock(rec, activeId)
    }

    transformLegacyBooking(
        smTransfer: LegacyBookingDb,
        index: number,
        activeId: number
    ): BookingDb {
        return this._transformer.transformLegacyBooking(smTransfer, index, activeId)
    }

    private validateExportData(
        accounts: AccountDb[],
        stocks: StockDb[],
        bookingTypes: BookingTypeDb[],
        bookings: BookingDb[]
    ): void {
        const errors: string[] = []

        if (!Array.isArray(accounts)) errors.push('Invalid accounts data')
        if (!Array.isArray(stocks)) errors.push('Invalid stocks data')
        if (!Array.isArray(bookingTypes)) errors.push('Invalid booking types data')
        if (!Array.isArray(bookings)) errors.push('Invalid bookings data')

        if (errors.length > 0) {
            throw new AppError(
                'Export data validation failed',
                'VALIDATION_FAILED',
                SYSTEM.ERROR_CATEGORY.VALIDATION,
                {ieError: errors},
                false
            )
        }
    }
}

UtilsService.log('--- services/importExport.ts ---')
