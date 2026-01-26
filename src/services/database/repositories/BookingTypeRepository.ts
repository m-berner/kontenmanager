/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {INDEXED_DB} from '@/config/database'
import type {BookingTypeDb} from '@/types'
import {IndexedDbBase} from '../base'

export class BookingTypeRepository {
    constructor(private _dbBase: IndexedDbBase) {
    }

    async getAllByAccount(accountId: number, tx?: IDBTransaction): Promise<BookingTypeDb[]> {
        return this._dbBase.getAllByIndex<BookingTypeDb>(
            INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`,
            accountId,
            tx
        )
    }

    async deleteByAccount(accountId: number, tx: IDBTransaction): Promise<void> {
        const store = tx.objectStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME)
        const index = store.index(`${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`)
        return this._dbBase.deleteByCursor(index, IDBKeyRange.only(accountId))
    }
}
