/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {StoresConfigType, TranslationKeysType} from "@/types";

export const STORES: StoresConfigType = {
    INDEXES: {
        dax: "DAX",
        dow: "Dow Jones",
        nasdaq: "NASDAQ Comp.",
        nikkei: "NIKKEI 225",
        hang: "Hang Seng",
        ibex: "IBEX 35",
        straits: "Straits Times",
        asx: "Australia All Ordinaries",
        rts: "RTS",
        bovespa: "BOVESPA",
        sensex: "SENSEX",
        sci: "Shanghai Composite",
        ftse: "FTSE 100",
        smi: "SMI",
        cac: "CAC 40",
        stoxx: "Euro Stoxx 50",
        tsx: "S&P/TSX",
        sp: "S&P 500"
    },
    MATERIALS: {
        au: "Goldpreis",
        ag: "Silberpreis",
        brent: "Ölpreis (Brent)",
        wti: "Ölpreis (WTI)",
        cu: "Kupferpreis",
        pt: "Platinpreis",
        al: "Aluminiumpreis",
        ni: "Nickelpreis",
        sn: "Zinnpreis",
        pb: "Bleipreis",
        pd: "Palladiumpreis"
    }
} as const;

export const TRANSLATION_KEYS: TranslationKeysType = {
    ag: "views.optionsIndex.materials.ag",
    al: "views.optionsIndex.materials.al",
    au: "views.optionsIndex.materials.au",
    brent: "views.optionsIndex.materials.brent",
    cu: "views.optionsIndex.materials.cu",
    ni: "views.optionsIndex.materials.ni",
    pb: "views.optionsIndex.materials.pb",
    pd: "views.optionsIndex.materials.pd",
    pt: "views.optionsIndex.materials.pt",
    sn: "views.optionsIndex.materials.sn",
    wti: "views.optionsIndex.materials.wti"
};
