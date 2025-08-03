import { useApp } from '@/apis/useApp';
const { CONS, mean, notice, toNumber } = useApp();
export const useFetch = () => {
    return {
        fetchCompanyData: async (isin) => {
            return new Promise(async (resolve, reject) => {
                let sDocument;
                let company = '';
                let child;
                let wkn;
                let symbol;
                const service = CONS.SERVICES.TGATE;
                let tables;
                let firstResponse;
                let result = {
                    company: '',
                    wkn: '',
                    symbol: ''
                };
                if (service !== undefined) {
                    firstResponse = await fetch(service.QUOTE + isin);
                    if (firstResponse.url.length === 0 ||
                        !firstResponse.ok ||
                        firstResponse.status >= CONS.STATES.SRV ||
                        (firstResponse.status > 0 &&
                            firstResponse.status < CONS.STATES.SUCCESS)) {
                        await notice(['First request failed']);
                        reject('First request failed');
                    }
                    else {
                        const secondResponse = await fetch(firstResponse.url);
                        if (!secondResponse.ok ||
                            secondResponse.status >= CONS.STATES.SRV ||
                            (secondResponse.status > 0 &&
                                secondResponse.status < CONS.STATES.SUCCESS)) {
                            await notice(['Second request failed']);
                            reject('Second request failed');
                        }
                        else {
                            const secondResponseText = await secondResponse.text();
                            sDocument = new DOMParser().parseFromString(secondResponseText, 'text/html');
                            tables = sDocument.querySelectorAll('table > tbody tr');
                            child = sDocument?.querySelector('#col1_content')?.childNodes[1];
                            company =
                                child?.textContent !== null
                                    ? child?.textContent.split(',')[0].trim() ?? ''
                                    : '';
                            if (!company.includes('Die Gattung wird') &&
                                tables[1].cells !== null &&
                                tables.length > 0) {
                                wkn = tables[1].cells[0].textContent ?? '';
                                symbol = tables[1].cells[1].textContent ?? '';
                                result = {
                                    company,
                                    wkn,
                                    symbol
                                };
                                resolve(result);
                            }
                            else {
                                reject('Unexpected error occurred');
                            }
                        }
                    }
                }
            });
        },
        fetchMinRateMaxData: async (storageOnline) => {
            console.log('BACKGROUND: fetchMinRateMaxData');
            return new Promise(async (resolve, reject) => {
                const storageService = await browser.storage.local.get(CONS.STORAGE.PROPS.SERVICE);
                const serviceName = storageService[CONS.STORAGE.PROPS.SERVICE].name;
                const _fnet = async (urls) => {
                    return await Promise.all(urls.map(async (urlObj) => {
                        const firstResponse = await fetch(urlObj.url);
                        const secondResponse = await fetch(firstResponse.url);
                        const secondResponseText = await secondResponse.text();
                        const onlineDocument = new DOMParser().parseFromString(secondResponseText, 'text/html');
                        const onlineNodes = onlineDocument.querySelectorAll('#snapshot-value-fst-current-0 > span');
                        const onlineArticleNodes = onlineDocument.querySelectorAll('main div[class=accordion__content]');
                        let onlineMin = '0';
                        let onlineMax = '0';
                        let onlineCurrency = 'EUR';
                        let onlineRate = '0';
                        if (onlineArticleNodes.length > 0) {
                            const onlineMmNodes = onlineArticleNodes[0].querySelectorAll('table > tbody > tr');
                            for (let i = 0; i < onlineMmNodes.length; i++) {
                                if (onlineMmNodes[i].textContent?.includes('1 Jahr')) {
                                    const tr = onlineMmNodes[i].querySelectorAll('td');
                                    onlineMin =
                                        tr[3].textContent ?? '0';
                                    onlineMax =
                                        tr[4].textContent ?? '0';
                                }
                            }
                        }
                        if (onlineNodes.length > 1) {
                            onlineCurrency = onlineNodes[1].textContent ?? '';
                            onlineRate = onlineNodes[0].textContent ?? '';
                        }
                        return {
                            id: urlObj.id,
                            isin: '',
                            rate: onlineRate,
                            min: onlineMin,
                            max: onlineMax,
                            cur: onlineCurrency
                        };
                    }));
                };
                const _ard = async (urls) => {
                    return await Promise.all(urls.map(async (urlObj) => {
                        const firstResponse = await fetch(urlObj.url);
                        const firstResponseText = await firstResponse.text();
                        const firstResponseDocument = new DOMParser().parseFromString(firstResponseText, 'text/html');
                        const firstResponseRows = firstResponseDocument.querySelectorAll('#desktopSearchResult > table > tbody > tr');
                        if (firstResponseRows.length > 0) {
                            const url = firstResponseRows[0].getAttribute('onclick') ?? '';
                            const secondResponse = await fetch(url.replace('document.location=\'', '').replace('\';', ''));
                            const secondResponseText = await secondResponse.text();
                            const onlineDocument = new DOMParser().parseFromString(secondResponseText, 'text/html');
                            const onlineCurrency = 'EUR';
                            const ardRows = onlineDocument.querySelectorAll('#USFkursdaten table > tbody tr');
                            const onlineRate = (ardRows[0].cells[1].textContent ?? '0').replace('€', '');
                            const onlineMin = (ardRows[6].cells[1].textContent ?? '0').replace('€', '');
                            const onlineMax = (ardRows[7].cells[1].textContent ?? '0').replace('€', '');
                            return {
                                id: urlObj.id,
                                isin: '',
                                rate: onlineRate,
                                min: onlineMin,
                                max: onlineMax,
                                cur: onlineCurrency
                            };
                        }
                        else {
                            return {
                                id: urlObj.id,
                                isin: '',
                                rate: '0',
                                min: '0',
                                max: '0',
                                cur: 'EUR'
                            };
                        }
                    }));
                };
                const _wstreet = async (urls, homeUrl) => {
                    return await Promise.all(urls.map(async (urlObj) => {
                        const firstResponse = await fetch(urlObj.url);
                        const firstResponseJson = await firstResponse.json();
                        const url2 = homeUrl + firstResponseJson.result[0].link;
                        const secondResponse = await fetch(url2);
                        const secondResponseText = await secondResponse.text();
                        const onlineDocument = new DOMParser().parseFromString(secondResponseText, 'text/html');
                        const onlineRates = onlineDocument.querySelectorAll('div.c2 table');
                        const onlineMinMax = onlineDocument.querySelectorAll('div.fundamental > div > div.float-start');
                        let onlineCurrency = '';
                        const onlineRate = onlineRates[0]
                            ?.querySelectorAll('tr')[1]
                            ?.querySelectorAll('td')[1].textContent ?? '0';
                        const onlineMax = onlineMinMax[1].textContent?.split('Hoch')[1];
                        const onlineMin = onlineMinMax[1].textContent?.split('Hoch')[0].split('WochenTief')[1];
                        if (onlineRate.includes('USD')) {
                            onlineCurrency = 'USD';
                        }
                        else if (onlineRate.includes('EUR')) {
                            onlineCurrency = 'EUR';
                        }
                        return {
                            id: urlObj.id ?? 0,
                            isin: '',
                            rate: onlineRate,
                            min: onlineMin ?? '',
                            max: onlineMax ?? '',
                            cur: onlineCurrency
                        };
                    }));
                };
                const _goyax = async (urls) => {
                    return await Promise.all(urls.map(async (urlObj) => {
                        const firstResponse = await fetch(urlObj.url);
                        const secondResponse = await fetch(firstResponse.url);
                        const secondResponseText = await secondResponse.text();
                        const onlineDocument = new DOMParser().parseFromString(secondResponseText, 'text/html');
                        const onlineNodes = onlineDocument.querySelectorAll('div#instrument-ueberblick > div');
                        const onlineRateNodes = onlineNodes[1].querySelectorAll('ul.list-rows');
                        const onlineRateAll = onlineRateNodes[1].querySelectorAll('li')[3].textContent ?? '0';
                        const onlineRate = onlineRateAll.split(')')[1] ?? '0';
                        const onlineStatisticRows = onlineNodes[0]
                            .querySelectorAll('table')[1]
                            .querySelectorAll('tr');
                        const onlineMax = onlineStatisticRows[4].querySelectorAll('td')[3].textContent ??
                            '0';
                        const onlineMin = onlineStatisticRows[5].querySelectorAll('td')[3].textContent ??
                            '0';
                        const onlineCurrency = 'EUR';
                        return {
                            id: urlObj.id,
                            isin: '',
                            rate: onlineRate,
                            min: onlineMin,
                            max: onlineMax,
                            cur: onlineCurrency
                        };
                    }));
                };
                const _acheck = async (urls) => {
                    return await Promise.all(urls.map(async (urlObj) => {
                        const firstResponse = await fetch(urlObj.url);
                        let onlineCurrency = '';
                        const secondResponse = await fetch(firstResponse.url);
                        const secondResponseText = await secondResponse.text();
                        const onlineDocument = new DOMParser().parseFromString(secondResponseText, 'text/html');
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
                                id: urlObj.id,
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
                };
                const _tgate = async (urls) => {
                    return await Promise.all(urls.map(async (urlObj) => {
                        const firstResponse = await fetch(urlObj.url);
                        const onlineCurrency = 'EUR';
                        const onlineMax = '0';
                        const onlineMin = '0';
                        const onlineDocument = new DOMParser().parseFromString(await firstResponse.text(), 'text/html');
                        const resultask = onlineDocument.querySelector('#ask') !== null
                            ? onlineDocument.querySelector('#ask')?.textContent
                            : '0';
                        const resultbid = onlineDocument.querySelector('#bid') !== null
                            ? onlineDocument.querySelector('#bid')?.textContent
                            : '0';
                        const quote = mean([toNumber(resultbid), toNumber(resultask)]);
                        const onlineRate = quote.toString();
                        return {
                            id: urlObj.id,
                            isin: '',
                            rate: onlineRate,
                            min: onlineMin,
                            max: onlineMax,
                            cur: onlineCurrency
                        };
                    }));
                };
                const _select = async (urls) => {
                    return new Promise(async (resolve, reject) => {
                        const service = CONS.SERVICES.MAP.get(serviceName);
                        switch (serviceName) {
                            case 'fnet':
                                resolve(await _fnet(urls));
                                break;
                            case 'ard':
                                resolve(await _ard(urls));
                                break;
                            case 'wstreet':
                                if (service !== undefined) {
                                    resolve(await _wstreet(urls, service.HOME));
                                }
                                else {
                                    reject('Undefined service constant!');
                                }
                                break;
                            case 'goyax':
                                resolve(await _goyax(urls));
                                break;
                            case 'acheck':
                                resolve(await _acheck(urls));
                                break;
                            case 'tgate':
                                resolve(await _tgate(urls));
                                break;
                            default:
                                throw new Error('ONLINE: fetchMinRateMaxData: unknown service!');
                        }
                    });
                };
                const urls = [];
                if (storageOnline.length > 0) {
                    for (let i = 0; i < storageOnline.length; i++) {
                        const service = CONS.SERVICES.MAP.get(serviceName);
                        const isin = storageOnline[i].isin;
                        if (isin !== undefined && service !== undefined && service !== null) {
                            urls.push({
                                url: service.QUOTE + isin,
                                id: storageOnline[i].id ?? -1
                            });
                        }
                    }
                }
                else {
                    reject('System Error');
                }
                resolve(await _select(urls));
            });
        },
        fetchDailyChangeData: async (table, mode = CONS.SERVICES.TGATE.CHANGES.SMALL) => {
            console.log('BACKGROUND: fetchDailyChangesData');
            let valuestr;
            let company;
            let sDocument;
            let trCollection;
            let url = CONS.SERVICES.TGATE.CHB_URL ?? '' + table;
            let selector = '#kursliste_abc > tr';
            if (mode === CONS.SERVICES.TGATE.CHANGES.SMALL) {
                url = CONS.SERVICES.TGATE.CHS_URL ?? '' + table;
                selector = '#kursliste_daten > tr';
            }
            const convertHTMLEntities = (str) => {
                const entities = new Map([
                    ['aum', 'ä'],
                    ['Aum', 'Ä'],
                    ['oum', 'ö'],
                    ['Oum', 'Ö'],
                    ['uum', 'ü'],
                    ['Uum', 'Ü'],
                    ['amp', '&'],
                    ['eac', 'é'],
                    ['Eac', 'É'],
                    ['eci', 'ê'],
                    ['Eci', 'Ê'],
                    ['oac', 'ó'],
                    ['Oac', 'Ó'],
                    ['ael', 'æ'],
                    ['Ael', 'Æ']
                ]);
                const fMatch = (match) => {
                    return entities.get(match.substring(1, 4)) ?? '';
                };
                let result = '';
                if (str !== null) {
                    result = str
                        .trim()
                        .replace(new RegExp(CONS.SYSTEM.HTML_ENTITY, 'g'), fMatch);
                }
                return result;
            };
            const entry = {
                key: '',
                value: {
                    percentChange: '',
                    change: 0,
                    stringChange: ''
                }
            };
            const firstResponse = await fetch(url);
            const _changes = [];
            if (firstResponse.url.length === 0 ||
                !firstResponse.ok ||
                firstResponse.status >= CONS.STATES.SRV ||
                (firstResponse.status > 0 && firstResponse.status < CONS.STATES.SUCCESS)) {
                await notice(['Request failed']);
            }
            else {
                const firstResponseText = await firstResponse.text();
                sDocument = new DOMParser().parseFromString(firstResponseText, 'text/html');
                trCollection = sDocument.querySelectorAll(selector);
                for (let i = 0; i < trCollection.length; i++) {
                    valuestr = trCollection[i].childNodes[11].textContent ?? '';
                    company = convertHTMLEntities(trCollection[i].childNodes[1].textContent ?? '').replace('<wbr>', '');
                    entry.key = company.toUpperCase();
                    entry.value = {
                        percentChange: valuestr.replace(/\t/g, ''),
                        change: toNumber(valuestr),
                        stringChange: toNumber(valuestr).toString()
                    };
                    _changes.push({ ...entry });
                }
                console.error(trCollection, _changes);
            }
            return _changes;
        },
        fetchExchangesData: async (exchangeCodes) => {
            console.log('BACKGROUND: fetchExchangesData');
            const service = CONS.SERVICES.FX;
            const fExUrl = (code) => {
                if (service !== undefined) {
                    return `${service.QUOTE}${code.substring(0, 3)}&cp_input=${code.substring(3, 6)}&amount_from=1`;
                }
                else {
                    throw new Error('Undefined service constant!');
                }
            };
            return new Promise(async (resolve, reject) => {
                const result = [];
                for (let i = 0; i < exchangeCodes.length; i++) {
                    const firstResponse = await fetch(fExUrl(exchangeCodes[i]));
                    if (!firstResponse.ok ||
                        firstResponse.status >= CONS.STATES.SRV ||
                        (firstResponse.status > 0 &&
                            firstResponse.status < CONS.STATES.SUCCESS)) {
                        await notice([firstResponse.statusText]);
                        reject('System Error');
                    }
                    const firstResponseText = await firstResponse.text();
                    const resultDocument = new DOMParser().parseFromString(firstResponseText, 'text/html');
                    const resultTr = resultDocument.querySelector('form#formcalculator.formcalculator > div');
                    if (resultTr !== undefined && resultTr !== null) {
                        const resultString = resultTr.getAttribute('data-rate');
                        const resultMatchArray = resultString?.match(/[0-9]*\.?[0-9]+/g) ?? ['1'];
                        const exchangeRate = Number.parseFloat(resultMatchArray[0]);
                        result.push({ key: exchangeCodes[i], value: exchangeRate });
                    }
                }
                resolve(result);
                return result;
            });
        },
        fetchMaterialData: async () => {
            console.log('BACKGROUND: fetchMaterialData');
            return new Promise(async (resolve, reject) => {
                const materials = [];
                const firstResponse = await fetch(CONS.SERVICES.MAP.get('fnet')?.MATERIALS ?? '');
                if (!firstResponse.ok ||
                    firstResponse.status >= CONS.STATES.SRV ||
                    (firstResponse.status > 0 && firstResponse.status < CONS.STATES.SUCCESS)) {
                    await notice([firstResponse.statusText]);
                    reject('System error');
                }
                const firstResponseText = await firstResponse.text();
                const resultDocument = new DOMParser().parseFromString(firstResponseText, 'text/html');
                const resultTr = resultDocument.querySelectorAll('#commodity_prices > table > tbody tr');
                for (let i = 0; i < resultTr.length; i++) {
                    const material = CONS.SETTINGS.MATERIALS.get(resultTr[i].children[0].textContent ?? '');
                    if (resultTr[i].children[0].tagName === 'TD' &&
                        material !== undefined) {
                        materials.push({
                            key: material,
                            value: toNumber(resultTr[i].children[1].textContent)
                        });
                    }
                }
                resolve(materials);
            });
        },
        fetchIndexData: async () => {
            console.log('BACKGROUND: fetchIndexData');
            return new Promise(async (resolve, reject) => {
                const indexes = [];
                const indexesKeys = Object.keys(CONS.SETTINGS.INDEXES);
                const indexesValues = Object.values(CONS.SETTINGS.INDEXES);
                const firstResponse = await fetch(CONS.SERVICES.MAP.get('fnet')?.INDEXES ?? '');
                if (!firstResponse.ok ||
                    firstResponse.status >= CONS.STATES.SRV ||
                    (firstResponse.status > 0 && firstResponse.status < CONS.STATES.SUCCESS)) {
                    await notice([firstResponse.statusText]);
                    reject(firstResponse.statusText);
                }
                const firstResponseText = await firstResponse.text();
                const resultDocument = new DOMParser().parseFromString(firstResponseText, 'text/html');
                const resultTr = resultDocument.querySelectorAll('.index-world-map a');
                for (let i = 0; i < indexesKeys.length; i++) {
                    for (let j = 0; j < resultTr.length; j++) {
                        if (indexesValues[i].includes(resultTr[j].getAttribute('title') ?? '') &&
                            resultTr[j].children[0].textContent !== undefined) {
                            indexes.push({
                                key: indexesKeys[i],
                                value: toNumber(resultTr[j].children[0].textContent)
                            });
                        }
                    }
                }
                resolve(indexes);
            });
        },
        fetchDateData: async (obj) => {
            console.log('BACKGROUND: fetchDatesData');
            const gmqf = { gm: 0, qf: 0 };
            const parseGermanDate = (germanDateString) => {
                const parts = germanDateString.match(/(\d+)/g) ?? ['01', '01', '1970'];
                const year = parts.length === 3 && parts[2].length === 4 ? parts[2] : '1970';
                const month = parts.length === 3 ? parts[1].padStart(2, '0') : '01';
                const day = parts.length === 3 ? parts[0].padStart(2, '0') : '01';
                return new Date(`${year}-${month}-${day}`).getTime();
            };
            const firstResponse = await fetch('https://www.finanzen.net/suchergebnis.asp?_search=' + obj.isin);
            if (firstResponse.url.length === 0 ||
                !firstResponse.ok ||
                firstResponse.status >= CONS.STATES.SRV ||
                (firstResponse.status > 0 && firstResponse.status < CONS.STATES.SUCCESS)) {
                console.error('BACKGROUND: fetchDatesData: First request failed');
            }
            else {
                const atoms = firstResponse.url.split('/');
                const stockName = atoms[atoms.length - 1].replace('-aktie', '');
                const secondResponse = await fetch('https://www.finanzen.net/termine/' + stockName);
                if (!secondResponse.ok ||
                    secondResponse.status >= CONS.STATES.SRV ||
                    (secondResponse.status > 0 &&
                        secondResponse.status < CONS.STATES.SUCCESS)) {
                    console.error('BACKGROUND: fetchDatesData: Second request failed');
                }
                else {
                    const secondResponseText = await secondResponse.text();
                    const qfgmDocument = new DOMParser().parseFromString(secondResponseText, 'text/html');
                    const tables = qfgmDocument.querySelectorAll('.table');
                    const rows = tables[1].querySelectorAll('tr');
                    let stopGm = false;
                    let stopQf = false;
                    const gmqfString = { gm: '01.01.1970', qf: '01.01.1970' };
                    for (let j = 0; j < rows.length && !!(rows[j].cells[3]); j++) {
                        const row = rows[j].cells[3].textContent?.replaceAll('(e)*', '').trim() ?? '01.01.1970';
                        if (rows[j].cells[0].textContent === 'Quartalszahlen' &&
                            row !== '01.01.1970' &&
                            row.length === 10 &&
                            !stopQf) {
                            gmqfString.qf = row;
                            stopQf = true;
                        }
                        else if (rows[j].cells[0].textContent === 'Hauptversammlung' &&
                            row !== '01.01.1970' &&
                            row.length === 10 &&
                            !stopGm) {
                            gmqfString.gm = row;
                            stopGm = true;
                        }
                        if (stopQf && stopGm)
                            break;
                    }
                    gmqf.qf =
                        gmqfString.qf !== undefined && gmqfString.qf !== ''
                            ? parseGermanDate(gmqfString.qf)
                            : 0;
                    gmqf.gm =
                        gmqfString.gm !== undefined && gmqfString.gm !== ''
                            ? parseGermanDate(gmqfString.gm)
                            : 0;
                }
            }
            return { key: obj.id, value: gmqf };
        }
    };
};
