/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {INDEXED_DB} from '@/config/database'
import type {AccountDb} from '@/types'
import {IndexedDbBase} from '../base'

export class AccountRepository {
    constructor(private _dbBase: IndexedDbBase) {
    }

    async getAll(tx?: IDBTransaction): Promise<AccountDb[]> {
        return this._dbBase.getAll<AccountDb>(INDEXED_DB.STORE.ACCOUNTS.NAME, tx)
    }

    async delete(accountId: number, tx?: IDBTransaction): Promise<void> {
        return this._dbBase.remove(INDEXED_DB.STORE.ACCOUNTS.NAME, accountId, tx)
    }
}
