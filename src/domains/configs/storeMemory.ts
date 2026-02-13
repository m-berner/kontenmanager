/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

export const STORE_MEMORY = {
  STOCK: {
    mPortfolio: 0,
    mInvest: 0,
    mChange: 0,
    mBuyValue: 0,
    mEuroChange: 0,
    mMin: 0,
    mValue: 0,
    mMax: 0,
    mDividendYielda: 0,
    mDividendYeara: 0,
    mDividendYieldb: 0,
    mDividendYearb: 0,
    mRealDividend: 0,
    mRealBuyValue: 0,
    mDeleteable: false
  }
} as const;
