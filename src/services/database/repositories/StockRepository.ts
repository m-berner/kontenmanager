/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { INDEXED_DB } from "@/config/database";
import type { StockDb } from "@/types";
import { IndexedDbBase } from "../base";

export class StockRepository {
  constructor(private _dbBase: IndexedDbBase) {}

  async getAllByAccount(
    accountId: number,
    tx?: IDBTransaction
  ): Promise<StockDb[]> {
    return this._dbBase.getAllByIndex<StockDb>(
      INDEXED_DB.STORE.STOCKS.NAME,
      `${INDEXED_DB.STORE.STOCKS.NAME}_k3`,
      accountId,
      tx
    );
  }

  async deleteByAccount(accountId: number, tx: IDBTransaction): Promise<void> {
    const store = tx.objectStore(INDEXED_DB.STORE.STOCKS.NAME);
    const index = store.index(`${INDEXED_DB.STORE.STOCKS.NAME}_k3`);
    return this._dbBase.deleteByCursor(index, IDBKeyRange.only(accountId));
  }
}
