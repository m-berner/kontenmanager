/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { INDEXED_DB } from "@/config/database";
import type { BookingTypeDb } from "@/types";
import { IndexedDbBase } from "../base";
import { DomainUtils } from "@/domains/utils";

/**
 * Repository for booking-type store specific queries.
 */
export class BookingTypeRepository {
  /**
   * @param _dbBase - Low-level DB helper used to execute operations.
   */
  constructor(private _dbBase: IndexedDbBase) {}

  /**
   * Retrieves all booking types for a given account.
   * @param accountId - Account foreign key.
   * @param tx - Optional active transaction.
   * @returns List of booking types.
   */
  async getAllByAccount(
    accountId: number,
    tx?: IDBTransaction
  ): Promise<BookingTypeDb[]> {
    return this._dbBase.getAllByIndex<BookingTypeDb>(
      INDEXED_DB.STORE.BOOKING_TYPES.NAME,
      `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`,
      accountId,
      tx
    );
  }

  /**
   * Deletes all booking types belonging to an account using a cursor on the
   * account-index.
   * @param accountId - Account foreign key.
   * @param tx - Required open readwrite transaction.
   */
  async deleteByAccount(accountId: number, tx: IDBTransaction): Promise<void> {
    const store = tx.objectStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME);
    const index = store.index(`${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`);
    return this._dbBase.deleteByCursor(index, IDBKeyRange.only(accountId));
  }
}

DomainUtils.log("SERVICES DATABASE REPOSITORIES BookingTypeRepository");
