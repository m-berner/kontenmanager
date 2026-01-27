import { AppError, ERROR_CATEGORY, ERROR_CODES } from '@/domains/errors';
import { UtilsService } from '@/domains/utils';
import { FETCH } from '@/config/fetch';
import { STORES } from '@/config/stores';
import { BROWSER_STORAGE } from '@/config/storage';
class FetchCache {
    cache = new Map();
    DEFAULT_TTL = 5 * 60 * 1000;
    set(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
        if (this.cache.size > 100)
            this.cleanup();
    }
    get(key, ttl = this.DEFAULT_TTL) {
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
            if (now - entry.timestamp > this.DEFAULT_TTL) {
                this.cache.delete(key);
            }
        }
    }
}
export class FetchService {
    cache;
    serviceFetchers = {
        fnet: async (urls) => {
            return Promise.all(urls.map(async (urlObj) => {
                const response = await this.fetchWithRetry(urlObj.value);
                const html = await this.fetchWithCache(response.url, response.url);
                const doc = await this.parseHTML(html);
                const nodes = doc.querySelectorAll('#snapshot-value-fst-current-0 > span');
                const articleNodes = doc.querySelectorAll('main div[class=accordion__content]');
                let min = '0', max = '0', currency = 'EUR', rate = '0';
                if (articleNodes.length > 0) {
                    const mmNodes = articleNodes[0].querySelectorAll('table > tbody > tr');
                    for (const row of mmNodes) {
                        if (row.textContent?.includes('1 Jahr')) {
                            const cells = row.querySelectorAll('td');
                            min = cells[3]?.textContent?.trim() || '0';
                            max = cells[4]?.textContent?.trim() || '0';
                            break;
                        }
                    }
                }
                if (nodes.length > 1) {
                    currency = nodes[1]?.textContent?.trim() || 'EUR';
                    rate = nodes[0]?.textContent?.trim() || '0';
                }
                return {
                    id: urlObj.key,
                    isin: '',
                    rate: rate.replace(/,/, '.'),
                    min: min.replace(/,/, '.'),
                    max: max.replace(/,/, '.'),
                    cur: currency
                };
            }));
        },
        ard: async (urls) => {
            return await Promise.all(urls.map(async (urlObj) => {
                const html = await this.fetchWithCache(urlObj.value, urlObj.value);
                const doc = await this.parseHTML(html);
                const rows = doc.querySelectorAll('#desktopSearchResult > table > tbody > tr');
                let min = '0', max = '0', currency = 'EUR', rate = '0';
                if (rows.length > 0) {
                    const attr = rows[0].getAttribute('onclick') ?? '';
                    const url = attr.replace('document.location=\'', '').replace('\';', '');
                    const html2 = await this.fetchWithCache(url, url);
                    const doc2 = await this.parseHTML(html2);
                    currency = 'EUR';
                    const ardRows = doc2.querySelectorAll('#USFkursdaten table > tbody tr');
                    rate = (ardRows[0].cells[1].textContent ?? '0').replace('â‚¬', '');
                    min = (ardRows[6].cells[1].textContent ?? '0').replace('â‚¬', '');
                    max = (ardRows[7].cells[1].textContent ?? '0').replace('â‚¬', '');
                    return {
                        id: urlObj.key,
                        isin: '',
                        rate: rate.replace(/,/, '.'),
                        min: min.replace(/,/, '.'),
                        max: max.replace(/,/, '.'),
                        cur: currency
                    };
                }
                else {
                    return {
                        id: urlObj.key,
                        isin: '',
                        rate: '0',
                        min: '0',
                        max: '0',
                        cur: 'EUR'
                    };
                }
            }));
        },
        wstreet: async (urls) => {
            return await Promise.all(urls.map(async (urlObj) => {
                const response = await this.fetchWithRetry(urlObj.value);
                const responseJson = await response.json();
                const html = await this.fetchWithCache(responseJson.result[0].link, FETCH.MAP.get('wstreet')?.HOME + responseJson.result[0].link);
                const doc = await this.parseHTML(html);
                const nodes = doc.querySelectorAll('div.c2 table');
                const articleNodes = doc.querySelectorAll('div.fundamental > div > div.float-start');
                let min = '0', max = '0', currency = 'EUR', rate = '0';
                rate = nodes[0]?.querySelectorAll('tr')[1]?.querySelectorAll('td')[1].textContent ?? '0';
                max = articleNodes[1]?.textContent?.split('Hoch')[1] ?? '0';
                min = articleNodes[1]?.textContent?.split('Hoch')[0].split('WochenTief')[1] ?? '0';
                if (rate.includes('USD')) {
                    currency = 'USD';
                }
                else if (rate.includes('EUR')) {
                    currency = 'EUR';
                }
                return {
                    id: urlObj.key ?? 0,
                    isin: '',
                    rate: rate.replace(/,/, '.'),
                    min: min.replace(/,/, '.') ?? '',
                    max: max.replace(/,/, '.') ?? '',
                    cur: currency
                };
            }));
        },
        goyax: async (urls) => {
            return await Promise.all(urls.map(async (urlObj) => {
                const response = await this.fetchWithRetry(urlObj.value);
                const html = await this.fetchWithCache(response.url, response.url);
                const doc = await this.parseHTML(html);
                const nodes = doc.querySelectorAll('div#instrument-ueberblick > div');
                const listRows = nodes[1].querySelectorAll('ul.list-rows');
                const rateAll = listRows[1].querySelectorAll('li')[3].textContent ?? '0';
                const rows = nodes[0].querySelectorAll('table')[1].querySelectorAll('tr');
                let min = '0', max = '0', rate = '0';
                rate = rateAll.split(')')[1] ?? '0';
                max = rows[4].querySelectorAll('td')[3].textContent ?? '0';
                min = rows[5].querySelectorAll('td')[3].textContent ?? '0';
                return {
                    id: urlObj.key,
                    isin: '',
                    rate: rate.replace(/,/, '.'),
                    min: min.replace(/,/, '.'),
                    max: max.replace(/,/, '.'),
                    cur: 'EUR'
                };
            }));
        },
        acheck: async (urls) => {
            return await Promise.all(urls.map(async (urlObj) => {
                let onlineCurrency = '';
                const response = await this.fetchWithRetry(urlObj.value);
                const html = await this.fetchWithCache(response.url, response.url);
                const doc = await this.parseHTML(html);
                const onlineTables = doc.querySelectorAll('#content table');
                if (onlineTables.length > 1) {
                    const onlineRate = onlineTables[0]
                        .querySelectorAll('tr')[1]
                        .querySelectorAll('td')[1].textContent ?? '0';
                    const findCurrency = onlineTables[0]
                        .querySelectorAll('tr')[1]
                        .querySelectorAll('td')[2].textContent ?? '0';
                    const onlineMin = onlineTables[2]
                        .querySelectorAll('tr')[3]
                        .querySelectorAll('td')[2].textContent ?? '0';
                    const onlineMax = onlineTables[2]
                        .querySelectorAll('tr')[3]
                        .querySelectorAll('td')[1].textContent ?? '0';
                    if (findCurrency.includes('$')) {
                        onlineCurrency = 'USD';
                    }
                    else if (findCurrency.includes('â‚¬')) {
                        onlineCurrency = 'EUR';
                    }
                    return {
                        id: urlObj.key,
                        isin: '',
                        rate: onlineRate,
                        min: onlineMin,
                        max: onlineMax,
                        cur: onlineCurrency
                    };
                }
                else {
                    return {
                        id: -1,
                        isin: '',
                        rate: '0',
                        min: '0',
                        max: '0',
                        cur: 'EUR'
                    };
                }
            }));
        },
        tgate: async (urls) => {
            return Promise.all(urls.map(async (urlObj) => {
                const html = await this.fetchWithCache(urlObj.value, urlObj.value);
                const doc = await this.parseHTML(html);
                const ask = doc.querySelector('#ask')?.textContent || '0';
                const bid = doc.querySelector('#bid')?.textContent || '0';
                const quote = UtilsService.mean([UtilsService.toNumber(bid), UtilsService.toNumber(ask)]);
                return {
                    id: urlObj.key,
                    isin: '',
                    rate: quote.toString(),
                    min: '0',
                    max: '0',
                    cur: 'EUR'
                };
            }));
        }
    };
    constructor() {
        this.cache = new FetchCache();
    }
    async fetchWithRetry(url, options = {}, maxRetries = 3) {
        let lastError = null;
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
                catch (error) {
                    lastError = error;
                    if (attempt < maxRetries) {
                        await this.delay(1000 * attempt);
                    }
                }
            }
        }
        finally {
            clearTimeout(timeoutId);
        }
        throw new AppError(ERROR_CODES.SERVICES.FETCH.A, ERROR_CATEGORY.NETWORK, { input: lastError?.message, entity: 'fetch service' }, true);
    }
    async fetchWithCache(key, url, ttl = 5 * 60 * 1000) {
        const cached = this.cache.get(key, ttl);
        if (cached) {
            UtilsService.log(`Cache hit for ${key}`);
            return cached;
        }
        UtilsService.log(`Cache miss for ${key}, fetching...`);
        const response = await this.fetchWithRetry(url);
        const text = await response.text();
        this.cache.set(key, text);
        return text;
    }
    async parseHTML(text) {
        if (!text) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.B, ERROR_CATEGORY.VALIDATION, { input: text, entity: 'fetch service' }, false);
        }
        return new DOMParser().parseFromString(text, 'text/html');
    }
    async fetchCompanyData(isin) {
        if (!isin || isin.length !== 12) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.C, ERROR_CATEGORY.VALIDATION, { isin }, false);
        }
        const service = FETCH.MAP.get('tgate');
        if (!service) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.D, ERROR_CATEGORY.VALIDATION, { service: 'tgate' }, false);
        }
        const firstResponse = await this.fetchWithRetry(service.QUOTE + isin);
        const secondResponse = await this.fetchWithRetry(firstResponse.url);
        const html = await secondResponse.text();
        const doc = await this.parseHTML(html);
        const nameNode = doc.querySelector('#col1_content')?.childNodes[1];
        const company = nameNode?.textContent?.split(',')[0].trim() || '';
        if (!company || company.includes('Die Gattung wird')) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.E, ERROR_CATEGORY.VALIDATION, { url: firstResponse.url }, false);
        }
        const tables = doc.querySelectorAll('table > tbody tr');
        const symbol = tables[1]?.cells[1]?.textContent?.trim() || '';
        if (!symbol) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.F, ERROR_CATEGORY.VALIDATION, { url: firstResponse.url }, false);
        }
        return { company, symbol };
    }
    async fetchMinRateMaxData(storageOnline, getStorage) {
        if (storageOnline.length === 0) {
            return [];
        }
        UtilsService.log('Fetching min/rate/max data', { count: storageOnline.length });
        const storageService = await getStorage([BROWSER_STORAGE.SERVICE.key]);
        const serviceName = storageService[BROWSER_STORAGE.SERVICE.key];
        const service = FETCH.MAP.get(serviceName);
        if (!service) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.G, ERROR_CATEGORY.VALIDATION, { serviceName }, false);
        }
        const fetcher = this.serviceFetchers[serviceName];
        if (!fetcher) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.H, ERROR_CATEGORY.NETWORK, { serviceName }, false);
        }
        const urls = storageOnline.map(item => ({
            value: service.QUOTE + item.isin,
            key: item.id ?? -1
        }));
        return fetcher(urls);
    }
    async fetchDateData(obj) {
        if (obj.length === 0)
            return [];
        const parseGermanDate = (germanDateString) => {
            const parts = germanDateString.match(/(\d+)/g) ?? ['01', '01', '1970'];
            const year = parts.length === 3 && parts[2].length === 4 ? parts[2] : '1970';
            const month = parts.length === 3 ? parts[1].padStart(2, '0') : '01';
            const day = parts.length === 3 ? parts[0].padStart(2, '0') : '01';
            return new Date(`${year}-${month}-${day}`).getTime();
        };
        return Promise.all(obj.map(async (entry) => {
            const gmqf = { gm: 0, qf: 0 };
            try {
                const firstResponse = await this.fetchWithRetry(`${FETCH.FNET.SEARCH}${entry.value}`);
                const atoms = firstResponse.url.split('/');
                const stockName = atoms[atoms.length - 1].replace('-aktie', '');
                const html = await this.fetchWithCache(`${FETCH.FNET.DATES}${stockName}`, `${FETCH.FNET.DATES}${stockName}`);
                const doc = await this.parseHTML(html);
                const tables = doc.querySelectorAll('.table');
                if (tables.length < 2) {
                    return { key: entry.key, value: gmqf };
                }
                const rows = tables[1].querySelectorAll('tr');
                let stopGm = false;
                let stopQf = false;
                for (const row of rows) {
                    if (!row.cells[3])
                        continue;
                    const dateText = row.cells[3].textContent?.replaceAll('(e)*', '').trim() ?? '01.01.1970';
                    const rowType = row.cells[0]?.textContent;
                    if (rowType === 'Quartalszahlen' &&
                        !stopQf &&
                        dateText !== '01.01.1970' &&
                        dateText.length === 10) {
                        gmqf.qf = parseGermanDate(dateText);
                        stopQf = true;
                    }
                    else if (rowType === 'Hauptversammlung' &&
                        !stopGm &&
                        dateText !== '01.01.1970' &&
                        dateText.length === 10) {
                        gmqf.gm = parseGermanDate(dateText);
                        stopGm = true;
                    }
                    if (stopQf && stopGm)
                        break;
                }
            }
            catch (error) {
                UtilsService.log('Failed to fetch date data', { entry, error }, 'warn');
            }
            return { key: entry.key, value: gmqf };
        }));
    }
    async fetchExchangesData(exchangeCodes) {
        if (exchangeCodes.length === 0)
            return [];
        const service = FETCH.FX;
        if (!service) {
            throw new AppError(ERROR_CODES.SERVICES.FETCH.I, ERROR_CATEGORY.NETWORK, { input: exchangeCodes }, false);
        }
        const results = await Promise.allSettled(exchangeCodes.map(async (code) => {
            const url = `${service.QUOTE}${code.substring(0, 3)}&cp_input=${code.substring(3, 6)}&amount_from=1`;
            const html = await this.fetchWithCache(url, url);
            const doc = await this.parseHTML(html);
            const rateElement = doc.querySelector('form#formcalculator.formcalculator > div');
            if (!rateElement) {
                throw new AppError(ERROR_CODES.SERVICES.FETCH.J, ERROR_CATEGORY.NETWORK, { url }, false);
            }
            const rateString = rateElement.getAttribute('data-rate');
            const rateMatch = rateString?.match(/[0-9]*\.?[0-9]+/g);
            const rate = rateMatch ? Number.parseFloat(rateMatch[0]) : 1;
            return { key: code, value: rate };
        }));
        return results
            .filter((r) => r.status === 'fulfilled')
            .map(r => r.value);
    }
    async fetchIndexData() {
        UtilsService.log('Fetching index data');
        const html = await this.fetchWithCache(FETCH.FNET.INDEXES, FETCH.FNET.INDEXES);
        const doc = await this.parseHTML(html);
        const links = doc.querySelectorAll('.index-world-map a');
        const indexes = [];
        for (const [property, indexValue] of STORES.INDEXES.entries()) {
            for (const link of links) {
                const title = link.getAttribute('title');
                const valueText = link.children[0]?.textContent;
                if (indexValue?.includes(title || '') && valueText) {
                    indexes.push({
                        key: property,
                        value: UtilsService.toNumber(valueText)
                    });
                    break;
                }
            }
        }
        return indexes;
    }
    async fetchMaterialData() {
        UtilsService.log('Fetching material data');
        const html = await this.fetchWithCache(FETCH.FNET.MATERIALS, FETCH.FNET.MATERIALS);
        const doc = await this.parseHTML(html);
        const rows = doc.querySelectorAll('#commodity_prices > table > tbody tr');
        const materials = [];
        for (const row of rows) {
            const nameCell = row.children[0];
            const valueCell = row.children[1];
            if (nameCell?.tagName === 'TD' && valueCell) {
                const name = nameCell.textContent?.trim();
                const value = UtilsService.toNumber(valueCell.textContent);
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
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
export const fetchService = new FetchService();
UtilsService.log('--- services/fetch.ts ---');
