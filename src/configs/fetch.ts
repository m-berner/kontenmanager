/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {FetchConfigType} from "@/types";

export const FETCH: FetchConfigType = {
    PROVIDERS: {
        goyax: {
            NAME: "Goyax",
            HOME: "https://www.goyax.de/",
            QUOTE: "https://www.goyax.de/aktien/"
        },
        fnet: {
            NAME: "Finanzen.Net",
            HOME: "https://www.finanzen.net/aktienkurse/",
            QUOTE: "https://www.finanzen.net/suchergebnis.asp?_search="
        },
        wstreet: {
            NAME: "Wallstreet-Online",
            HOME: "https://www.wallstreet-online.de",
            QUOTE:
                "https://www.wallstreet-online.de/_rpc/json/search/auto/searchInst/"
        },
        acheck: {
            NAME: "Aktien Check",
            HOME: "https://m.aktiencheck.de/",
            QUOTE: "https://m.aktiencheck.de/quotes/suche/?search="
        },
        ard: {
            NAME: "ARD",
            HOME: "https://www.tagesschau.de/wirtschaft/boersenkurse/",
            QUOTE:
                "https://www.tagesschau.de/wirtschaft/boersenkurse/suche/?suchbegriff="
        },
        tgate: {
            NAME: "Tradegate",
            HOME: "https://www.tradegate.de/",
            QUOTE: "https://www.tradegate.de/orderbuch.php?isin="
        }
    },
    FNET: {
        INDEXES: "https://www.finanzen.net/indizes/",
        DATES: "https://www.finanzen.net/termine/",
        MATERIALS: "https://www.finanzen.net/rohstoffe/",
        ONLINE_TEST: "https://www.finanzen.net",
        SEARCH: "https://www.finanzen.net/suchergebnis.asp?_search="
    },
    // TGATE: {
    //   CHANGES_URL_SMALL: "https://www.tradegate.de/indizes.php?index=",
    //   CHANGES_URL_BIG: "https://www.tradegate.de/indizes.php?buchstabe=",
    //   CHS: [
    //     "DE000A1EXRV0",
    //     "DE000A1EXRY4",
    //     "DE000A1EXRW8",
    //     "DE000A1EXRX6",
    //     "EU0009658145",
    //     "DE000A0SNK21",
    //     "US0000000002"
    //   ],
    //   CHB: [
    //     "1",
    //     "2",
    //     "3",
    //     "4",
    //     "5",
    //     "7",
    //     "8",
    //     "9",
    //     "A",
    //     "B",
    //     "C",
    //     "D",
    //     "E",
    //     "F",
    //     "G",
    //     "H",
    //     "I",
    //     "J",
    //     "K",
    //     "L",
    //     "M",
    //     "N",
    //     "O",
    //     "P",
    //     "Q",
    //     "R",
    //     "S",
    //     "T",
    //     "U",
    //     "V",
    //     "W",
    //     "X",
    //     "Y",
    //     "Z",
    //     "Ö"
    //   ]
    // },
    FX: {
        NAME: "fx-rate",
        HOME: "https://fx-rate.net/qwsaq",
        QUOTE: "https://fx-rate.net/calculator/?c_input="
    },
    DEFAULT_TTL: 5 * 60 * 1000,
    DEFAULT_VALUE: "0",
    DEFAULT_CURRENCY: "EUR",
    TARGET_PERIOD: "1 Jahr",
    DEFAULT_CURRENCY_SYMBOL: "€"
} as const;
