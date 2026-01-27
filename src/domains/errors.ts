/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {AppErrorCategoryType} from '@/types'

export const ERROR_CODES = {
    ADD_ACCOUNT: '#olt',
    DELETE_ACCOUNT_CONFIRMATION: '#khi',
    DELETE_BOOKING_TYPE: '#pol',
    EXPORT_DATABASE: {
        A: '#dbx',
        B: '#dbz',
        C: '#dbm'
    },
    FADE_IN_STOCK: '#fis',
    IMPORT_DATABASE: {
        A: '#idb',
        B: '#idz'
    },
    STOCK_FORM: '#sfo',
    USE_BROWSER: {
        A: '#ubx',
        B: '#ubz',
        C: '#ubm',
        D: '#ubs',
        E: '#ubt',
        F: '#ubv',
        G: '#ubw',
        H: '#ubx',
        I: '#uby',
        J: '#ubz'
    },
    USE_DIALOG_GUARDS: {
        A: '#wqa',
        B: '#wqb',
        C: '#wqc'
    },
    USE_MENU: {
        A: '#sav',
        B: '#kcm'
    },
    USE_STORAGE: {
        A: '#sux',
        B: '#suz',
        C: '#sum',
        D: '#sus'
    },
    UTILS: {
        A: '#sav',
        B: '#kcm',
        C: '#but'
    },
    IMPORT_EXPORT: {
        A: '#idb',
        B: '#idz'
    },
    VALIDATION: {
        A: '#zzu',
        B: '#zzv',
        C: '#zzw',
        D: '#zzx'
    },
    IMPORT_EXPORT_SERVICE: {
        A: '#syg',
        B: '#syh',
        C: '#syi',
        D: '#syj',
        E: '#syk',
        F: '#syl',
        G: '#sym',
        H: '#syn'
    },
    APP_SERVICE: '#gxl',
    SERVICES: {
        DATABASE: {
            A: '#dbx',
            B: '#dbz',
            C: '#dbm',
            D: '#dbo',
            E: '#dbp',
            F: '#dbq',
            BASE: {
                A: '#dbz',
                B: '#dbm',
                C: '#dbn',
                D: '#dbo',
                E: '#dbp',
                F: '#dbq',
                G: '#dbr',
                H: '#dbs',
                I: '#dbt',
                J: '#dbv'
            }
        },
        FETCH: {
            A: '#nsl',
            B: '#nsm',
            C: '#nsn',
            D: '#nso',
            E: '#nsp',
            F: '#nsq',
            G: '#nst',
            H: '#nsu',
            I: '#nsx',
            J: '#nsy'
        }
    },
    STORES: {
        BOOKINGS: {
            A: '#bks'
        }
    },
    VIEWS: {
        APP_INDEX: {
            A: '#nay'
        }
    }
}
export const ERROR_CATEGORY = {
    DATABASE: 'database',
    NETWORK: 'network',
    VALIDATION: 'validation',
    BUSINESS: 'business'
}
const ERRORS = {
    [ERROR_CODES.VIEWS.APP_INDEX.A]: 'App initialization failed',
    [ERROR_CODES.STORES.BOOKINGS.A]: 'No booking found for ID',
    [ERROR_CODES.SERVICES.DATABASE.BASE.A]: 'Failed to delete by cursor',
    [ERROR_CODES.SERVICES.DATABASE.BASE.B]: 'Failed to add record',
    [ERROR_CODES.SERVICES.DATABASE.BASE.C]: 'Failed to get record',
    [ERROR_CODES.SERVICES.DATABASE.BASE.D]: 'Failed to getAll records',
    [ERROR_CODES.SERVICES.DATABASE.BASE.E]: 'Failed to update record',
    [ERROR_CODES.SERVICES.DATABASE.BASE.F]: 'Failed to delete record',
    [ERROR_CODES.SERVICES.DATABASE.BASE.G]: 'Failed to clear store',
    [ERROR_CODES.SERVICES.DATABASE.BASE.H]: 'Failed to get all records by index',
    [ERROR_CODES.SERVICES.DATABASE.BASE.I]: 'Database not connected',
    [ERROR_CODES.SERVICES.DATABASE.A]: 'Failed to open IndexedDB connection',
    [ERROR_CODES.SERVICES.DATABASE.B]: 'Error closing database',
    [ERROR_CODES.SERVICES.DATABASE.C]: 'Delete operation requires a key',
    [ERROR_CODES.SERVICES.DATABASE.D]: 'Unknown operation type',
    [ERROR_CODES.SERVICES.DATABASE.E]: 'Delete operation requires a key',
    [ERROR_CODES.SERVICES.DATABASE.F]: 'Unknown operation type',
    [ERROR_CODES.SERVICES.FETCH.A]: 'Failed to receive data',
    [ERROR_CODES.SERVICES.FETCH.B]: 'Invalid HTML input',
    [ERROR_CODES.SERVICES.FETCH.C]: 'Invalid ISIN format',
    [ERROR_CODES.SERVICES.FETCH.D]: 'Service configuration not found',
    [ERROR_CODES.SERVICES.FETCH.E]: 'Company not found or inactive',
    [ERROR_CODES.SERVICES.FETCH.F]: 'Symbol not found',
    [ERROR_CODES.SERVICES.FETCH.G]: 'Service not configured',
    [ERROR_CODES.SERVICES.FETCH.H]: 'Unsupported service',
    [ERROR_CODES.SERVICES.FETCH.I]: 'FX service not configured',
    [ERROR_CODES.SERVICES.FETCH.J]: 'Exchange rate not found',
    [ERROR_CODES.USE_BROWSER.A]: 'Could not read the browser language'
}

/**
 * Custom error class for application-specific errors.
 * Includes additional context for better debugging and error handling.
 */
export class AppError extends Error {
    /**
     * @param code - Unique error code for identification.
     * @param _category - Classification of the error (e.g., 'database', 'network').
     * @param _context - Optional key-value pairs with extra debugging information.
     * @param _recoverable - Whether the application can continue after this error.
     */
    constructor(
        public readonly code: string,
        public readonly _category: AppErrorCategoryType,
        public readonly _context?: Record<string, unknown>,
        public readonly _recoverable: boolean = true
    ) {
        super(ERRORS[code])
        this.name = 'AppError'
    }
}
