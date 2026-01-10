import { useApp } from '@/composables/useApp';
import { useBrowser } from '@/composables/useBrowser';
import { useAppConfig } from '@/composables/useAppConfig';
const { log, mean, toNumber } = useApp();
const { BROWSER_STORAGE, SERVICES, SETTINGS, SYSTEM } = useAppConfig();
const { getStorage } = useBrowser();
export class FetchError extends Error {
    _statusCode;
    _url;
    _context;
    constructor(message, _statusCode, _url, _context) {
        super(message);
        this._statusCode = _statusCode;
        this._url = _url;
        this._context = _context;
        this.name = 'FetchError';
    }
}
class FetchCache {
    cache = new Map();
    DEFAULT_TTL = 5 * 60 * 1000;
    set(key, data, _ttl) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        if (this.cache.size > 100) {
            this.cleanup();
        }
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
    has(key, ttl = this.DEFAULT_TTL) {
        return this.get(key, ttl) !== null;
    }
    clear() {
        this.cache.clear();
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.DEFAULT_TTL) {
                this.cache.delete(key);
            }
        }
    }
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
const requestCache = new FetchCache();
export function useFetch() {
    const fetchError = (resp, url) => {
        throw new FetchError(`HTTP ${resp.status}: ${resp.statusText}`, resp.status, url);
    };
    async function fetchWithRetry(url, options = {}, maxRetries = 3) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    if (response.status >= 500 && attempt < maxRetries) {
                        await delay(1000 * attempt);
                        continue;
                    }
                    fetchError(response, url);
                }
                return response;
            }
            catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    log(`Fetch attempt ${attempt} failed, retrying...`, error, 'warn');
                    await delay(1000 * attempt);
                }
            }
        }
        throw new FetchError(`Failed after ${maxRetries} attempts: ${lastError?.message}`, undefined, url, { originalError: lastError });
    }
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function parseHTML(text) {
        try {
            return new DOMParser().parseFromString(text, 'text/html');
        }
        catch (error) {
            throw new FetchError('Failed to parse HTML', undefined, undefined, { originalError: error });
        }
    }
    async function fetchWithCache(key, url, ttl = 5 * 60 * 1000) {
        const cached = requestCache.get(key, ttl);
        if (cached) {
            log(`Cache hit for ${key}`);
            return cached;
        }
        log(`Cache miss for ${key}, fetching...`);
        const response = await fetchWithRetry(url);
        const text = await response.text();
        requestCache.set(key, text, ttl);
        return text;
    }
    async function fetchIsOk() {
        log('Checking internet connectivity...');
        try {
            const response = await fetchWithRetry(SERVICES.FNET.ONLINE_TEST, {}, 1);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async function fetchCompanyData(isin) {
        if (!isin || isin.length !== 12) {
            throw new FetchError('Invalid ISIN format', undefined, undefined, { isin });
        }
        log('Fetching company data', { isin });
        const service = SERVICES.MAP.get('tgate');
        if (!service) {
            throw new FetchError('Service configuration not found', undefined, undefined, { service: 'tgate' });
        }
        const isValidCompany = (comName, url) => {
            if (!comName || comName.includes('Die Gattung wird')) {
                throw new FetchError('Company not found or inactive', 404, url, { isin });
            }
        };
        const isValidSymbol = (symName, url) => {
            if (!symName) {
                throw new FetchError('Symbol not found', 404, url, { isin });
            }
        };
        try {
            const firstResponse = await fetchWithRetry(service.QUOTE + isin);
            const secondResponse = await fetchWithRetry(firstResponse.url);
            const html = await secondResponse.text();
            const doc = parseHTML(html);
            const nameNode = doc.querySelector('#col1_content')?.childNodes[1];
            const company = nameNode?.textContent?.split(',')[0].trim() || '';
            isValidCompany(company, firstResponse.url);
            const tables = doc.querySelectorAll('table > tbody tr');
            const symbol = tables[1]?.cells[1]?.textContent?.trim() || '';
            isValidSymbol(symbol, firstResponse.url);
            return { company, symbol };
        }
        catch (error) {
            if (error instanceof FetchError)
                throw error;
            throw new FetchError('Failed to fetch company data', undefined, undefined, { isin, originalError: error });
        }
    }
    const serviceFetchers = {
        async fnet(urls) {
            return Promise.all(urls.map(async (urlObj) => {
                const response = await fetchWithRetry(urlObj.value);
                const html = await fetchWithCache(response.url, response.url);
                const doc = parseHTML(html);
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
        async ard(urls) {
            return await Promise.all(urls.map(async (urlObj) => {
                const html = await fetchWithCache(urlObj.value, urlObj.value);
                const doc = parseHTML(html);
                const rows = doc.querySelectorAll('#desktopSearchResult > table > tbody > tr');
                let min = '0', max = '0', currency = 'EUR', rate = '0';
                if (rows.length > 0) {
                    const attr = rows[0].getAttribute('onclick') ?? '';
                    const url = attr.replace('document.location=\'', '').replace('\';', '');
                    const html2 = await fetchWithCache(url, url);
                    const doc2 = new DOMParser().parseFromString(html2, 'text/html');
                    currency = 'EUR';
                    const ardRows = doc2.querySelectorAll('#USFkursdaten table > tbody tr');
                    rate = (ardRows[0].cells[1].textContent ?? '0').replace('€', '');
                    min = (ardRows[6].cells[1].textContent ?? '0').replace('€', '');
                    max = (ardRows[7].cells[1].textContent ?? '0').replace('€', '');
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
        async wstreet(urls) {
            return await Promise.all(urls.map(async (urlObj) => {
                const response = await fetchWithRetry(urlObj.value);
                const responseJson = await response.json();
                const html = await fetchWithCache(responseJson.result[0].link, SERVICES.MAP.get('wstreet')?.HOME + responseJson.result[0].link);
                const doc = parseHTML(html);
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
        async goyax(urls) {
            return await Promise.all(urls.map(async (urlObj) => {
                const response = await fetchWithRetry(urlObj.value);
                const html = await fetchWithCache(response.url, response.url);
                const doc = parseHTML(html);
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
        async acheck(urls) {
            return await Promise.all(urls.map(async (urlObj) => {
                let onlineCurrency = '';
                const firstResponse = await fetchWithRetry(urlObj.value);
                const secondResponseText = fetchWithCache(firstResponse.url, firstResponse.url);
                const onlineDocument = parseHTML(await secondResponseText);
                const onlineTables = onlineDocument.querySelectorAll('#content table');
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
                    else if (findCurrency.includes('€')) {
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
        async tgate(urls) {
            return Promise.all(urls.map(async (urlObj) => {
                const html = await fetchWithCache(urlObj.value, urlObj.value);
                const doc = parseHTML(html);
                const ask = doc.querySelector('#ask')?.textContent || '0';
                const bid = doc.querySelector('#bid')?.textContent || '0';
                const quote = mean([toNumber(bid), toNumber(ask)]);
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
    async function fetchMinRateMaxData(storageOnline) {
        if (storageOnline.length === 0) {
            return [];
        }
        log('Fetching min/rate/max data', { count: storageOnline.length });
        const storageService = await getStorage([BROWSER_STORAGE.SERVICE.key]);
        const serviceName = storageService[BROWSER_STORAGE.SERVICE.key];
        const service = SERVICES.MAP.get(serviceName);
        if (!service) {
            throw new FetchError('Service not configured', undefined, undefined, { serviceName });
        }
        const fetcher = serviceFetchers[serviceName];
        if (!fetcher) {
            throw new FetchError('Unsupported service', undefined, undefined, { serviceName });
        }
        const urls = storageOnline.map(item => ({
            value: service.QUOTE + item.isin,
            key: item.id ?? -1
        }));
        return fetcher(urls);
    }
    async function fetchExchangesData(exchangeCodes) {
        if (exchangeCodes.length === 0) {
            return [];
        }
        log('Fetching exchange data', { codes: exchangeCodes });
        const service = SERVICES.FX;
        if (!service) {
            throw new FetchError('FX service not configured');
        }
        const results = await Promise.allSettled(exchangeCodes.map(async (code) => {
            const url = `${service.QUOTE}${code.substring(0, 3)}&cp_input=${code.substring(3, 6)}&amount_from=1`;
            const html = await fetchWithCache(url, url);
            const doc = parseHTML(html);
            const rateElement = doc.querySelector('form#formcalculator.formcalculator > div');
            if (!rateElement) {
                throw new FetchError('Exchange rate not found', 404, url, { code });
            }
            const rateString = rateElement.getAttribute('data-rate');
            const rateMatch = rateString?.match(/[0-9]*\.?[0-9]+/g);
            const rate = rateMatch ? Number.parseFloat(rateMatch[0]) : 1;
            return { key: code, value: rate };
        }));
        const successfulResults = [];
        for (const result of results) {
            if (result.status === 'fulfilled') {
                successfulResults.push(result.value);
            }
            else {
                log('Exchange fetch failed', result.reason, 'warn');
            }
        }
        return successfulResults;
    }
    async function fetchMaterialData() {
        log('Fetching material data');
        const html = await fetchWithCache(SERVICES.FNET.MATERIALS, SERVICES.FNET.MATERIALS);
        const doc = parseHTML(html);
        const rows = doc.querySelectorAll('#commodity_prices > table > tbody tr');
        const materials = [];
        for (const row of rows) {
            const nameCell = row.children[0];
            const valueCell = row.children[1];
            if (nameCell?.tagName === 'TD' && valueCell) {
                const name = nameCell.textContent?.trim();
                const value = toNumber(valueCell.textContent);
                if (name) {
                    materials.push({ key: name, value });
                }
            }
        }
        return materials;
    }
    async function fetchIndexData() {
        log('Fetching index data');
        const html = await fetchWithCache(SERVICES.FNET.INDEXES, SERVICES.FNET.INDEXES);
        const doc = parseHTML(html);
        const links = doc.querySelectorAll('.index-world-map a');
        const indexes = [];
        for (const [property, indexValue] of SETTINGS.INDEXES.entries()) {
            for (const link of links) {
                const title = link.getAttribute('title');
                const valueText = link.children[0]?.textContent;
                if (indexValue?.includes(title || '') && valueText) {
                    indexes.push({
                        key: property,
                        value: toNumber(valueText)
                    });
                    break;
                }
            }
        }
        return indexes;
    }
    async function fetchDailyChangeData(table, mode = SERVICES.TGATE.CHANGES.SMALL) {
        log('Fetching daily changes', { table, mode });
        const url = mode === SERVICES.TGATE.CHANGES.SMALL
            ? `${SERVICES.TGATE.CHS_URL}${table}`
            : `${SERVICES.TGATE.CHB_URL}${table}`;
        const selector = mode === SERVICES.TGATE.CHANGES.SMALL
            ? '#kursliste_daten > tr'
            : '#kursliste_abc > tr';
        const html = await fetchWithRetry(url).then(r => r.text());
        const doc = parseHTML(html);
        const rows = doc.querySelectorAll(selector);
        const changes = [];
        for (const row of rows) {
            const company = convertHTMLEntities(row.childNodes[1]?.textContent || '').replace('<wbr>', '');
            const valueStr = row.childNodes[11]?.textContent?.trim() || '0';
            changes.push({
                key: company.toUpperCase(),
                value: {
                    percentChange: valueStr.replace(/\t/g, ''),
                    change: toNumber(valueStr),
                    stringChange: toNumber(valueStr).toString()
                }
            });
        }
        return changes;
    }
    function convertHTMLEntities(str) {
        if (!str)
            return '';
        const entities = new Map([
            ['aum', 'ä'], ['Aum', 'Ä'],
            ['oum', 'ö'], ['Oum', 'Ö'],
            ['uum', 'ü'], ['Uum', 'Ü'],
            ['amp', '&'],
            ['eac', 'é'], ['Eac', 'É'],
            ['eci', 'ê'], ['Eci', 'Ê'],
            ['oac', 'ó'], ['Oac', 'Ó'],
            ['ael', 'æ'], ['Ael', 'Æ']
        ]);
        return str
            .trim()
            .replace(new RegExp(SYSTEM.HTML_ENTITY, 'g'), (match) => {
            const code = match.substring(1, 4);
            return entities.get(code) || '';
        });
    }
    async function fetchDateData(items) {
        if (items.length === 0)
            return [];
        log('Fetching date data', { count: items.length });
        return Promise.all(items.map(async (item) => {
            const gmqf = { gm: 0, qf: 0 };
            try {
                const response = await fetchWithRetry(`${SERVICES.FNET.SEARCH}${item.value}`);
                const atoms = response.url.split('/');
                const stockName = atoms[atoms.length - 1].replace('-aktie', '');
                const html = await fetchWithCache(`${SERVICES.FNET.DATES}${stockName}`, `${SERVICES.FNET.DATES}${stockName}`);
                const doc = parseHTML(html);
                const tables = doc.querySelectorAll('.table');
                if (tables.length < 2) {
                    return { key: item.key, value: gmqf };
                }
                const rows = tables[1].querySelectorAll('tr');
                let foundQf = false, foundGm = false;
                for (const row of rows) {
                    if (!row.cells[3])
                        continue;
                    const dateText = row.cells[3].textContent
                        ?.replaceAll('(e)*', '')
                        .trim() || '';
                    const rowType = row.cells[0]?.textContent;
                    if (rowType === 'Quartalszahlen' && !foundQf && dateText.length === 10) {
                        gmqf.qf = parseGermanDate(dateText);
                        foundQf = true;
                    }
                    else if (rowType === 'Hauptversammlung' && !foundGm && dateText.length === 10) {
                        gmqf.gm = parseGermanDate(dateText);
                        foundGm = true;
                    }
                    if (foundQf && foundGm)
                        break;
                }
            }
            catch (error) {
                log('Failed to fetch date data', { item, error }, 'warn');
            }
            return { key: item.key, value: gmqf };
        }));
    }
    function parseGermanDate(germanDateString) {
        const parts = germanDateString.match(/(\d+)/g) || [];
        if (parts.length !== 3)
            return 0;
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 4 ? parts[2] : '1970';
        return new Date(`${year}-${month}-${day}`).getTime();
    }
    function getCacheStats() {
        return requestCache.getStats();
    }
    function clearCache() {
        requestCache.clear();
    }
    return {
        fetchWithRetry,
        fetchWithCache,
        parseHTML,
        fetchIsOk,
        fetchCompanyData,
        fetchMinRateMaxData,
        fetchDailyChangeData,
        fetchExchangesData,
        fetchMaterialData,
        fetchIndexData,
        fetchDateData,
        getCacheStats,
        clearCache
    };
}
