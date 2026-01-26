/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {AppErrorCategoryType} from '@/types'

/**
 * Custom error class for application-specific errors.
 * Includes additional context for better debugging and error handling.
 */
export class AppError extends Error {
    /**
     * @param message - Human-readable error message.
     * @param _code - Unique error code for identification.
     * @param _category - Classification of the error (e.g., 'database', 'network').
     * @param _context - Optional key-value pairs with extra debugging information.
     * @param _recoverable - Whether the application can continue after this error.
     */
    constructor(
        message: string,
        public readonly _code: string,
        public readonly _category: AppErrorCategoryType,
        public readonly _context?: Record<string, unknown>,
        public readonly _recoverable: boolean = true
    ) {
        super(message)
        this.name = 'AppError'
    }
}
