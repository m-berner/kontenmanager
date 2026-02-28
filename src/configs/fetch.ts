/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

export const FETCH = {
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
    }
} as const;
