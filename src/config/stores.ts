/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import { STORE_MEMORY } from "@/domains/config/storeMemory";

export const STORES = Object.freeze({
  INDEXES: new Map<string, string>([
    ["dax", "DAX"],
    ["dow", "Dow Jones"],
    ["nasdaq", "NASDAQ Comp."],
    ["nikkei", "NIKKEI 225"],
    ["hang", "Hang Seng"],
    ["ibex", "IBEX 35"],
    ["straits", "Straits Times"],
    ["asx", "Australia All Ordinaries"],
    ["rts", "RTS"],
    ["bovespa", "BOVESPA"],
    ["sensex", "SENSEX"],
    ["sci", "Shanghai Composite"],
    ["ftse", "FTSE 100"],
    ["smi", "SMI"],
    ["cac", "CAC 40"],
    ["stoxx", "Euro Stoxx 50"],
    ["tsx", "S&P/TSX"],
    ["sp", "S&P 500"]
  ]),
  MATERIALS: new Map<string, string>([
    ["au", "Goldpreis"],
    ["ag", "Silberpreis"],
    ["brent", "Ölpreis (Brent)"],
    ["wti", "Ölpreis (WTI)"],
    ["cu", "Kupferpreis"],
    ["pt", "Platinpreis"],
    ["al", "Aluminiumpreis"],
    ["ni", "Nickelpreis"],
    ["sn", "Zinnpreis"],
    ["pb", "Bleipreis"],
    ["pd", "Palladiumpreis"]
  ]),
  STOCK_STORE_MEMORY: STORE_MEMORY
  // STOCK_STORE_MEMORY: {
  //   mPortfolio: 0,
  //   mInvest: 0,
  //   mChange: 0,
  //   mBuyValue: 0,
  //   mEuroChange: 0,
  //   mMin: 0,
  //   mValue: 0,
  //   mMax: 0,
  //   mDividendYielda: 0,
  //   mDividendYeara: 0,
  //   mDividendYieldb: 0,
  //   mDividendYearb: 0,
  //   mRealDividend: 0,
  //   mRealBuyValue: 0,
  //   mDeleteable: false
  // }
});
