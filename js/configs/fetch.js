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
            QUOTE: "https://www.wallstreet-online.de/_rpc/json/search/auto/searchInst/"
        },
        acheck: {
            NAME: "Aktien Check",
            HOME: "https://m.aktiencheck.de/",
            QUOTE: "https://m.aktiencheck.de/quotes/suche/?search="
        },
        ard: {
            NAME: "ARD",
            HOME: "https://www.tagesschau.de/wirtschaft/boersenkurse/",
            QUOTE: "https://www.tagesschau.de/wirtschaft/boersenkurse/suche/?suchbegriff="
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
};
