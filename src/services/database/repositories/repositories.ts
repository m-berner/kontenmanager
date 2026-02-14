/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { INDEXED_DB } from "@/configs/database";
import type { AccountDb, BookingDb, BookingTypeDb, StockDb } from "@/types";
import { BaseRepository } from "../base";
import { DomainUtils } from "@/domains/utils";

/**
 * Repository for account-store specific queries.
 */
export class AccountRepository extends BaseRepository {
  /**
   * Retrieves all accounts.
   * @param tx - Optional active transaction.
   * @returns List of accounts.
   */
  async getAll(tx?: IDBTransaction): Promise<AccountDb[]> {
    return super._getAll<AccountDb>(INDEXED_DB.STORE.ACCOUNTS.NAME, tx);
  }

  /**
   * Deletes a single account by ID.
   * @param accountId - Primary key of the account to remove.
   * @param tx - Optional active transaction.
   */
  async delete(accountId: number, tx?: IDBTransaction): Promise<void> {
    return super._delete(INDEXED_DB.STORE.ACCOUNTS.NAME, accountId, tx);
  }
}

/**
 * Repository for booking-store specific queries.
 */
export class BookingRepository extends BaseRepository {
  /**
   * Retrieves all bookings for a given account.
   * @param accountId - Account foreign key.
   * @param tx - Optional active transaction.
   * @returns List of bookings.
   */
  async getAllByAccount(
    accountId: number,
    tx?: IDBTransaction
  ): Promise<BookingDb[]> {
    return super._getAllByAccount<BookingDb>(
      INDEXED_DB.STORE.BOOKINGS.NAME,
      `${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`,
      accountId,
      tx
    );
  }

  /**
   * Deletes all bookings belonging to an account.
   * @param accountId - Account foreign key.
   * @param tx - Required open readwrite transaction.
   */
  async deleteByAccount(accountId: number, tx: IDBTransaction): Promise<void> {
    return super._deleteByAccount(
      INDEXED_DB.STORE.BOOKINGS.NAME,
      `${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`,
      accountId,
      tx
    );
  }
}

/**
 * Repository for booking-type store specific queries.
 */
export class BookingTypeRepository extends BaseRepository {
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
    return super._getAllByAccount<BookingTypeDb>(
      INDEXED_DB.STORE.BOOKING_TYPES.NAME,
      `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`,
      accountId,
      tx
    );
  }

  /**
   * Deletes all booking types belonging to an account.
   * @param accountId - Account foreign key.
   * @param tx - Required open readwrite transaction.
   */
  async deleteByAccount(accountId: number, tx: IDBTransaction): Promise<void> {
    return super._deleteByAccount(
      INDEXED_DB.STORE.BOOKING_TYPES.NAME,
      `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`,
      accountId,
      tx
    );
  }
}

/**
 * Repository for stock-store specific queries.
 */
export class StockRepository extends BaseRepository {
  /**
   * Retrieves all stocks for a given account.
   * @param accountId - Account foreign key.
   * @param tx - Optional active transaction.
   * @returns List of stocks.
   */
  async getAllByAccount(
    accountId: number,
    tx?: IDBTransaction
  ): Promise<StockDb[]> {
    return super._getAllByAccount<StockDb>(
      INDEXED_DB.STORE.STOCKS.NAME,
      `${INDEXED_DB.STORE.STOCKS.NAME}_k3`,
      accountId,
      tx
    );
  }

  /**
   * Deletes all stocks belonging to an account.
   * @param accountId - Account foreign key.
   * @param tx - Required open readwrite transaction.
   */
  async deleteByAccount(accountId: number, tx: IDBTransaction): Promise<void> {
    return super._deleteByAccount(
      INDEXED_DB.STORE.STOCKS.NAME,
      `${INDEXED_DB.STORE.STOCKS.NAME}_k3`,
      accountId,
      tx
    );
  }
}

DomainUtils.log("SERVICES DATABASE REPOSITORIES (Refactored)");
