import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { FETCH } from "@/configs/fetch";
import { STORES } from "@/configs/stores";
import { BROWSER_STORAGE } from "@/domains/configs/storage";
class FetchCache {
    cache = new Map();
    constructor() { }
    set(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
        if (this.cache.size > 100)
            this.cleanup();
    }
    get(key, ttl = FETCH.DEFAULT_TTL) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        const isExpired = Date.now() - entry.timestamp > ttl;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    clear() {
        this.cache.clear();
    }
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > FETCH.DEFAULT_TTL) {
                this.cache.delete(key);
            }
        }
    }
}
class FetchService {
    cache;
    serviceFetchers = {
        fnet: async (urls) => {
            return Promise.all(urls.map(async (urlObj) => {
                const response = await this.fetchWithRetry(urlObj.value);
                const html = await this.fetchWithCache(response.url, response.url);
                const doc = await this.parseHTML(html);
                const { rate, currency } = this.extractFnetRateAndCurrency(doc);
                const { min, max } = this.extractFnetMinMax(doc);
                return {
                    id: urlObj.key,
                    isin: "",
                    rate: DomainUtils.normalizeNumber(rate, "de"),
                    min: DomainUtils.normalizeNumber(min, "de"),
                    max: DomainUtils.normalizeNumber(max, "de"),
                    cur: currency
                };
            }));
        },
        ard: async (urls) => {
            return Promise.all(urls.map(async (urlObj) => {
                const html = await this.fetchWithCache(urlObj.value, urlObj.value);
                const doc = await this.parseHTML(html);
                const detailUrl = this.extractArdDetailUrl(doc);
                if (!detailUrl) {
                    return this.createDefaultStockData(urlObj.key);
                }
                const detailHtml = await this.fetchWithCache(detailUrl, detailUrl);
                const detailDoc = await this.parseHTML(detailHtml);
                const { rate, min, max, currency } = this.extractArdStockData(detailDoc);
                return {
                    id: urlObj.key,
                    isin: "",
                    rate: DomainUtils.normalizeNumber(rate, "de"),
                    min: DomainUtils.normalizeNumber(min, "de"),
                    max: DomainUtils.normalizeNumber(max, "de"),
                    cur: currency
                };
            }));
        },
        wstreet: async (urls) => {
            return Promise.all(urls.map(async (urlObj) => {
                const response = await this.fetchWithRetry(urlObj.value);
                const responseJson = await response.json();
                const detailUrl = this.buildWStreetDetailUrl(responseJson);
                const html = await this.fetchWithCache(detailUrl, detailUrl);
                const doc = await this.parseHTML(html);
                const { rate, min, max, currency } = this.extractWStreetStockData(doc);
                return {
                    id: urlObj.key ?? 0,
                    isin: "",
                    rate: DomainUtils.normalizeNumber(rate, "de"),
                    min: DomainUtils.normalizeNumber(min, "de"),
                    max: DomainUtils.normalizeNumber(max, "de"),
                    cur: currency
                };
            }));
        },
        goyax: async (urls) => {
            return Promise.all(urls.map(async (urlObj) => {
                const response = await this.fetchWithRetry(urlObj.value);
                const html = await this.fetchWithCache(response.url, response.url);
                const doc = await this.parseHTML(html);
                const { rate, min, max } = this.extractGoyaxStockData(doc);
                return {
                    id: urlObj.key,
                    isin: "",
                    rate: DomainUtils.normalizeNumber(rate, "de"),
                    min: DomainUtils.normalizeNumber(min, "de"),
                    max: DomainUtils.normalizeNumber(max, "de"),
                    cur: FETCH.DEFAULT_CURRENCY
                };
            }));
        },
        acheck: async (urls) => {
            return Promise.all(urls.map(async (urlObj) => {
                const response = await this.fetchWithRetry(urlObj.value);
                const html = await this.fetchWithCache(response.url, response.url);
                const doc = await this.parseHTML(html);
                const stockData = this.extractAcheckStockData(doc);
                if (!stockData) {
                    return this.createDefaultStockData(-1);
                }
                return {
                    id: urlObj.key,
                    isin: "",
                    rate: DomainUtils.normalizeNumber(stockData.rate, "de"),
                    min: DomainUtils.normalizeNumber(stockData.min, "de"),
                    max: DomainUtils.normalizeNumber(stockData.max, "de"),
                    cur: stockData.currency
                };
            }));
        },
        tgate: async (urls) => {
            return Promise.all(urls.map(async (urlObj) => {
                const html = await this.fetchWithCache(urlObj.value, urlObj.value);
                const doc = await this.parseHTML(html);
                const { rate } = this.extractTgateStockData(doc);
                return {
                    id: urlObj.key,
                    isin: "",
                    rate,
                    min: FETCH.DEFAULT_VALUE,
                    max: FETCH.DEFAULT_VALUE,
                    cur: FETCH.DEFAULT_CURRENCY
                };
            }));
        }
    };
    constructor() {
        this.cache = new FetchCache();
    }
    async fetchWithRetry(url, options = {}, maxRetries = 3) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        try {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    return await fetch(url, {
                        ...options,
                        signal: options.signal || controller.signal
                    });
                }
                catch {
                    if (attempt < maxRetries) {
                        await this.delay(1000 * attempt);
                    }
                }
            }
        }
        finally {
            clearTimeout(timeoutId);
        }
        throw new AppError(ERROR_CODES.SERVICES.FETCH.A, ERROR_CATEGORY.NETWORK, true);
    }
    async fetchWithCache(key, url, ttl = FETCH.DEFAULT_TTL) {
        const cached = this.cache.get(key, ttl);
        if (cached) {
            DomainUtils.log(`SERVICES fetch: Cache hit for ${key}`);
            return cached;
        }
        DomainUtils.log(`SERVICES fetch: Cache miss for ${key}, fetching...`);
        const response = await this.fetchWithRetry(url);
        const text = await response.text();
        this.cache.set(key, text);
        return text;
    }
    async parseHTML(text) {
        if (!text) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.B, ERROR_CATEGORY.VALIDATION, false);
        }
        return new DOMParser().parseFromString(text, "text/html");
    }
    async fetchCompanyData(isin) {
        if (!isin || isin.length !== 12) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.C, ERROR_CATEGORY.VALIDATION, false);
        }
        const service = FETCH.PROVIDERS["tgate"];
        if (!service) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.D, ERROR_CATEGORY.VALIDATION, false);
        }
        const firstResponse = await this.fetchWithRetry(service.QUOTE + isin);
        const secondResponse = await this.fetchWithRetry(firstResponse.url);
        const html = await secondResponse.text();
        const doc = await this.parseHTML(html);
        const nameNode = doc.querySelector("#col1_content")?.childNodes[1];
        const company = nameNode?.textContent?.split(",")[0].trim() || "";
        if (!company || company.includes("Die Gattung wird")) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.E, ERROR_CATEGORY.VALIDATION, false);
        }
        const tables = doc.querySelectorAll("table > tbody tr");
        const symbol = tables[1]?.cells[1]?.textContent?.trim() || "";
        if (!symbol) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.F, ERROR_CATEGORY.VALIDATION, false);
        }
        return { company, symbol };
    }
    async fetchMinRateMaxData(storageOnline, getStorage) {
        if (storageOnline.length === 0) {
            return [];
        }
        DomainUtils.log("SERVICES fetch: Fetching min/rate/max data", {
            count: storageOnline.length
        });
        const storageService = await getStorage([BROWSER_STORAGE.SERVICE.key]);
        const serviceName = storageService[BROWSER_STORAGE.SERVICE.key];
        const service = FETCH.PROVIDERS[serviceName];
        if (!service) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.G, ERROR_CATEGORY.VALIDATION, false);
        }
        const fetcher = this.serviceFetchers[serviceName];
        if (!fetcher) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.H, ERROR_CATEGORY.NETWORK, false);
        }
        const urls = storageOnline.map((item) => ({
            value: service.QUOTE + item.isin,
            key: item.id ?? -1
        }));
        return fetcher(urls);
    }
    async fetchDateData(obj) {
        if (obj.length === 0)
            return [];
        const parseGermanDate = (germanDateString) => {
            const parts = germanDateString.match(/(\d+)/g) ?? ["01", "01", "1970"];
            const year = parts.length === 3 && parts[2].length === 4 ? parts[2] : "1970";
            const month = parts.length === 3 ? parts[1].padStart(2, "0") : "01";
            const day = parts.length === 3 ? parts[0].padStart(2, "0") : "01";
            return new Date(`${year}-${month}-${day}`).getTime();
        };
        return Promise.all(obj.map(async (entry) => {
            const gmqf = { gm: 0, qf: 0 };
            try {
                const firstResponse = await this.fetchWithRetry(`${FETCH.FNET.SEARCH}${entry.value}`);
                const atoms = firstResponse.url.split("/");
                const stockName = atoms[atoms.length - 1].replace("-aktie", "");
                const html = await this.fetchWithCache(`${FETCH.FNET.DATES}${stockName}`, `${FETCH.FNET.DATES}${stockName}`);
                const doc = await this.parseHTML(html);
                const tables = doc.querySelectorAll(".table");
                if (tables.length < 2) {
                    return { key: entry.key, value: gmqf };
                }
                const rows = tables[1].querySelectorAll("tr");
                let stopGm = false;
                let stopQf = false;
                for (const row of rows) {
                    if (!row.cells[3])
                        continue;
                    const dateText = row.cells[3].textContent?.replaceAll("(e)*", "").trim() ??
                        "01.01.1970";
                    const rowType = row.cells[0]?.textContent;
                    if (rowType === "Quartalszahlen" &&
                        !stopQf &&
                        dateText !== "01.01.1970" &&
                        dateText.length === 10) {
                        gmqf.qf = parseGermanDate(dateText);
                        stopQf = true;
                    }
                    else if (rowType === "Hauptversammlung" &&
                        !stopGm &&
                        dateText !== "01.01.1970" &&
                        dateText.length === 10) {
                        gmqf.gm = parseGermanDate(dateText);
                        stopGm = true;
                    }
                    if (stopQf && stopGm)
                        break;
                }
            }
            catch (error) {
                DomainUtils.log("SERVICES fetch: Failed to fetch date data", { entry, error }, "warn");
            }
            return { key: entry.key, value: gmqf };
        }));
    }
    async fetchExchangesData(exchangeCodes) {
        if (exchangeCodes.length === 0)
            return [];
        const service = FETCH.FX;
        if (!service) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.I, ERROR_CATEGORY.NETWORK, false);
        }
        const results = await Promise.allSettled(exchangeCodes.map(async (code) => {
            const url = `${service.QUOTE}${code.substring(0, 3)}&cp_input=${code.substring(3, 6)}&amount_from=1`;
            const html = await this.fetchWithCache(url, url);
            const doc = await this.parseHTML(html);
            const rateElement = doc.querySelector("form#formcalculator.formcalculator > div");
            if (!rateElement) {
                throw new AppError(ERROR_CODES.SERVICES.FETCH.J, ERROR_CATEGORY.NETWORK, false);
            }
            const rateString = rateElement.getAttribute("data-rate");
            const rateMatch = rateString?.match(/[0-9]*\.?[0-9]+/g);
            const rate = rateMatch ? Number.parseFloat(rateMatch[0]) : 1;
            return { key: code, value: rate };
        }));
        return results
            .filter((r) => r.status === "fulfilled")
            .map((r) => r.value);
    }
    async fetchIndexData() {
        DomainUtils.log("SERVICES fetch: Fetching index data");
        const html = await this.fetchWithCache(FETCH.FNET.INDEXES, FETCH.FNET.INDEXES);
        const doc = await this.parseHTML(html);
        const links = doc.querySelectorAll(".index-world-map a");
        const indexes = [];
        for (const property of Object.keys(STORES.INDEXES)) {
            for (const link of links) {
                const title = link.getAttribute("title");
                const valueText = link.children[0]?.textContent;
                if (STORES.INDEXES[property]?.includes(title || "") && valueText) {
                    indexes.push({
                        key: property,
                        value: DomainUtils.toNumber(valueText)
                    });
                    break;
                }
            }
        }
        return indexes;
    }
    async fetchMaterialData() {
        DomainUtils.log("SERVICES fetch: Fetching material data");
        const html = await this.fetchWithCache(FETCH.FNET.MATERIALS, FETCH.FNET.MATERIALS);
        const doc = await this.parseHTML(html);
        const rows = doc.querySelectorAll("#commodity_prices > table > tbody tr");
        const materials = [];
        for (const row of rows) {
            const nameCell = row.children[0];
            const valueCell = row.children[1];
            if (nameCell?.tagName === "TD" && valueCell) {
                const name = nameCell.textContent?.trim();
                const value = DomainUtils.toNumber(valueCell.textContent);
                if (name) {
                    materials.push({ key: name, value });
                }
            }
        }
        return materials;
    }
    async fetchIsOk() {
        return new Promise(async (resolve) => {
            const response = await this.fetchWithRetry(FETCH.FNET.ONLINE_TEST);
            resolve(response.ok);
        });
    }
    clearCache() {
        this.cache.clear();
    }
    getCacheStats() {
        return this.cache.getStats();
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    parseCurrency(code) {
        if (code.includes("USD") || code.includes("$")) {
            return "USD";
        }
        if (code.includes("EUR") || code.includes("€") || code.includes("â‚¬")) {
            return "EUR";
        }
        return FETCH.DEFAULT_CURRENCY;
    }
    extractFnetRateAndCurrency(doc) {
        const SEARCH_RESULT_SELECTOR = "#snapshot-value-fst-current-0 > span";
        const nodes = doc.querySelectorAll(SEARCH_RESULT_SELECTOR);
        if (nodes.length < 2) {
            return { rate: FETCH.DEFAULT_VALUE, currency: FETCH.DEFAULT_CURRENCY };
        }
        return {
            rate: nodes[0]?.textContent?.trim() || FETCH.DEFAULT_VALUE,
            currency: nodes[1]?.textContent?.trim() || FETCH.DEFAULT_CURRENCY
        };
    }
    extractFnetMinMax(doc) {
        const SEARCH_RESULT_SELECTOR = "main div[class=accordion__content]";
        const nodes = doc.querySelectorAll(SEARCH_RESULT_SELECTOR);
        if (nodes.length === 0) {
            return { min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE };
        }
        const rows = nodes[0].querySelectorAll("table > tbody > tr");
        for (const row of rows) {
            if (row.textContent?.includes(FETCH.TARGET_PERIOD)) {
                const cells = row.querySelectorAll("td");
                return {
                    min: cells[3]?.textContent?.trim() || FETCH.DEFAULT_VALUE,
                    max: cells[4]?.textContent?.trim() || FETCH.DEFAULT_VALUE
                };
            }
        }
        return { min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE };
    }
    extractArdDetailUrl(doc) {
        const DATA_TABLE_SELECTOR = "#desktopSearchResult > table > tbody > tr";
        const rows = doc.querySelectorAll(DATA_TABLE_SELECTOR);
        if (rows.length === 0) {
            return null;
        }
        const onclickAttr = rows[0].getAttribute("onclick");
        if (!onclickAttr) {
            return null;
        }
        return onclickAttr.replace("document.location='", "").replace("';", "");
    }
    extractArdStockData(doc) {
        const DATA_TABLE_SELECTOR = "#USFkursdaten table > tbody tr";
        const rows = doc.querySelectorAll(DATA_TABLE_SELECTOR);
        if (rows.length < 8) {
            return {
                rate: FETCH.DEFAULT_VALUE,
                min: FETCH.DEFAULT_VALUE,
                max: FETCH.DEFAULT_VALUE,
                currency: FETCH.DEFAULT_CURRENCY
            };
        }
        const cleanCell = (row, cellIndex) => {
            return (row.cells[cellIndex]?.textContent ?? FETCH.DEFAULT_VALUE).replace(FETCH.DEFAULT_CURRENCY_SYMBOL, "");
        };
        return {
            rate: cleanCell(rows[0], 1),
            min: cleanCell(rows[6], 1),
            max: cleanCell(rows[7], 1),
            currency: FETCH.DEFAULT_CURRENCY
        };
    }
    createDefaultStockData(id) {
        return {
            id,
            isin: "",
            rate: FETCH.DEFAULT_VALUE,
            min: FETCH.DEFAULT_VALUE,
            max: FETCH.DEFAULT_VALUE,
            cur: FETCH.DEFAULT_CURRENCY
        };
    }
    buildWStreetDetailUrl(responseJson) {
        const detailPath = responseJson.result?.[0]?.link ?? "";
        const baseUrl = FETCH.PROVIDERS["wstreet"]?.HOME ?? "";
        return baseUrl + detailPath;
    }
    extractWStreetStockData(doc) {
        const rate = this.extractWStreetRate(doc);
        const { min, max } = this.extractWStreetMinMax(doc);
        const currency = this.parseCurrency(rate);
        return {
            rate,
            min,
            max,
            currency
        };
    }
    extractWStreetRate(doc) {
        const RATE_TABLE_SELECTOR = "div.c2 table";
        const tables = doc.querySelectorAll(RATE_TABLE_SELECTOR);
        if (tables.length === 0) {
            return FETCH.DEFAULT_VALUE;
        }
        const rows = tables[0].querySelectorAll("tr");
        if (rows.length < 2) {
            return FETCH.DEFAULT_VALUE;
        }
        const cells = rows[1].querySelectorAll("td");
        return cells[1]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
    }
    extractWStreetMinMax(doc) {
        const FUNDAMENTAL_SELECTOR = "div.fundamental > div > div.float-start";
        const nodes = doc.querySelectorAll(FUNDAMENTAL_SELECTOR);
        if (nodes.length < 2) {
            return { min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE };
        }
        const text = nodes[1]?.textContent ?? "";
        const parts = text.split("Hoch");
        if (parts.length < 2) {
            return { min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE };
        }
        const max = parts[1]?.trim() ?? FETCH.DEFAULT_VALUE;
        const minParts = parts[0].split("WochenTief");
        const min = minParts.length > 1
            ? (minParts[1]?.trim() ?? FETCH.DEFAULT_VALUE)
            : FETCH.DEFAULT_VALUE;
        return { min, max };
    }
    extractGoyaxStockData(doc) {
        const rate = this.extractGoyaxRate(doc);
        const { min, max } = this.extractGoyaxMinMax(doc);
        return {
            rate,
            min,
            max,
            currency: FETCH.DEFAULT_CURRENCY
        };
    }
    extractGoyaxRate(doc) {
        const OVERVIEW_SELECTOR = "div#instrument-ueberblick > div";
        try {
            const nodes = doc.querySelectorAll(OVERVIEW_SELECTOR);
            if (nodes.length < 2) {
                return FETCH.DEFAULT_VALUE;
            }
            const listRows = nodes[1].querySelectorAll("ul.list-rows");
            if (listRows.length < 2) {
                return FETCH.DEFAULT_VALUE;
            }
            const listItems = listRows[1].querySelectorAll("li");
            if (listItems.length < 4) {
                return FETCH.DEFAULT_VALUE;
            }
            const rateText = listItems[3].textContent ?? FETCH.DEFAULT_VALUE;
            const parts = rateText.split(")");
            return parts.length > 1
                ? (parts[1]?.trim() ?? FETCH.DEFAULT_VALUE)
                : FETCH.DEFAULT_VALUE;
        }
        catch {
            return FETCH.DEFAULT_VALUE;
        }
    }
    extractGoyaxMinMax(doc) {
        const OVERVIEW_SELECTOR = "div#instrument-ueberblick > div";
        try {
            const nodes = doc.querySelectorAll(OVERVIEW_SELECTOR);
            if (nodes.length === 0) {
                return { min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE };
            }
            const tables = nodes[0].querySelectorAll("table");
            if (tables.length < 2) {
                return { min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE };
            }
            const rows = tables[1].querySelectorAll("tr");
            if (rows.length < 6) {
                return { min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE };
            }
            const maxCells = rows[4].querySelectorAll("td");
            const minCells = rows[5].querySelectorAll("td");
            const max = maxCells[3]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
            const min = minCells[3]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
            return { min, max };
        }
        catch {
            return { min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE };
        }
    }
    extractAcheckStockData(doc) {
        const CONTENT_TABLE_SELECTOR = "#content table";
        const MIN_REQUIRED_TABLES = 3;
        const tables = doc.querySelectorAll(CONTENT_TABLE_SELECTOR);
        if (tables.length < MIN_REQUIRED_TABLES) {
            return {
                rate: FETCH.DEFAULT_VALUE,
                min: FETCH.DEFAULT_VALUE,
                max: FETCH.DEFAULT_VALUE,
                currency: FETCH.DEFAULT_CURRENCY
            };
        }
        const rate = this.extractAcheckRate(tables[0]);
        const currencySymbol = this.extractAcheckCurrencySymbol(tables[0]);
        const { min, max } = this.extractAcheckMinMax(tables[2]);
        const currency = this.parseCurrency(currencySymbol);
        return { rate, min, max, currency };
    }
    extractAcheckRate(table) {
        const RATE_ROW = 1;
        const RATE_CELL = 1;
        try {
            const rows = table.querySelectorAll("tr");
            if (rows.length < RATE_ROW + 1) {
                return FETCH.DEFAULT_VALUE;
            }
            const cells = rows[RATE_ROW].querySelectorAll("td");
            return cells[RATE_CELL]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
        }
        catch {
            return FETCH.DEFAULT_VALUE;
        }
    }
    extractAcheckCurrencySymbol(table) {
        const CURRENCY_ROW = 1;
        const CURRENCY_CELL = 2;
        try {
            const rows = table.querySelectorAll("tr");
            if (rows.length < CURRENCY_ROW + 1) {
                return FETCH.DEFAULT_VALUE;
            }
            const cells = rows[CURRENCY_ROW].querySelectorAll("td");
            return cells[CURRENCY_CELL]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
        }
        catch {
            return FETCH.DEFAULT_VALUE;
        }
    }
    extractAcheckMinMax(table) {
        const MINMAX_ROW = 3;
        const MAX_CELL = 1;
        const MIN_CELL = 2;
        try {
            const rows = table.querySelectorAll("tr");
            if (rows.length < MINMAX_ROW + 1) {
                return { min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE };
            }
            const cells = rows[MINMAX_ROW].querySelectorAll("td");
            const max = cells[MAX_CELL]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
            const min = cells[MIN_CELL]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
            return { min, max };
        }
        catch {
            return { min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE };
        }
    }
    extractTgateStockData(doc) {
        const ASK_SELECTOR = "#ask";
        const BID_SELECTOR = "#bid";
        const ask = doc.querySelector(ASK_SELECTOR)?.textContent?.trim() ??
            FETCH.DEFAULT_VALUE;
        const bid = doc.querySelector(BID_SELECTOR)?.textContent?.trim() ??
            FETCH.DEFAULT_VALUE;
        const rate = this.calculateMidQuote(bid, ask);
        return { rate };
    }
    calculateMidQuote(bid, ask) {
        try {
            const bidNumber = DomainUtils.toNumber(bid);
            const askNumber = DomainUtils.toNumber(ask);
            if (isNaN(bidNumber) || isNaN(askNumber)) {
                return FETCH.DEFAULT_VALUE;
            }
            const midQuote = DomainUtils.mean([bidNumber, askNumber]);
            return midQuote.toString();
        }
        catch {
            return FETCH.DEFAULT_VALUE;
        }
    }
}
export const fetchService = new FetchService();
DomainUtils.log("SERVICES fetch");
