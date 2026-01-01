/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {
    I_Company_Data,
    I_Daily_Changes_Data,
    I_Date_Data,
    I_Exchange_Data,
    I_Min_Rate_Max_Data,
    I_Number_String,
    I_Storage_Online,
    I_String_Number
} from '@/types'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAppConfig} from '@/composables/useAppConfig'

const {log, mean, toNumber} = useApp()
const {BROWSER_STORAGE, STATES, SERVICES, SETTINGS, SYSTEM} = useAppConfig()
const {notice, getStorage} = useBrowser()

const requestCache = new Map<string, { dataText: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useFetch() {
    async function _fetchWithRetry(url: string): Promise<Response> {
        const response = await fetch(url)
        if (!response.ok || response.status >= STATES.SRV) {
            throw new Error(`Fetch failed: ${response.statusText}`)
        }
        return response
    }

    function _parseHTML(text: string): Document {
        return new DOMParser().parseFromString(text, 'text/html')
    }

    async function fetchWithCache(
        key: string,
        url: string,
        fetcher: (_url: string) => Promise<Response>
    ): Promise<string> {
        const cached = requestCache.get(key)
        const now = Date.now()

        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            return cached.dataText
        }

        const data: Response = await fetcher(url)
        if (data.ok) {
            const dataText = await data.text()
            requestCache.set(key, {dataText, timestamp: now})
            return dataText
        } else {
            throw new Error('Request failed!')
        }
    }

    /**
     * Tests the internet connectivity
     * @returns response.ok - true/false
     * @throws Error if the request fails
     */
    async function fetchIsOk(): Promise<boolean> {
        log('USE_FETCH: fetchIsOk')
        return new Promise(async (resolve): Promise<void> => {
            const firstResponse = await _fetchWithRetry(SERVICES.FNET.ONLINE_TEST)
            resolve(firstResponse.ok)
        })
    }

    /**
     * Fetches company data for a given ISIN
     * @param isin - The International Securities Identification Number
     * @returns Company name and trading symbol
     * @throws Error if the request fails or data cannot be parsed
     */
    async function fetchCompanyData(isin: string): Promise<I_Company_Data> {
        return new Promise(async (resolve, reject) => {
            let sDocument: Document
            let company = ''
            let child: ChildNode | undefined
            let symbol: string
            const service = SERVICES.MAP.get('tgate')
            let tables: NodeListOf<HTMLTableRowElement>
            let firstResponse: Response
            let result: I_Company_Data = {
                company: '',
                symbol: ''
            }
            if (service !== undefined) {
                firstResponse = await _fetchWithRetry(service.QUOTE + isin)
                if (firstResponse.ok) {
                    const secondResponse = await _fetchWithRetry(firstResponse.url)
                    if (secondResponse.ok) {
                        const secondResponseText = await secondResponse.text()
                        sDocument = _parseHTML(secondResponseText)
                        tables = sDocument.querySelectorAll('table > tbody tr')
                        child = sDocument?.querySelector('#col1_content')?.childNodes[1]
                        company =
                            child?.textContent !== null
                                ? child?.textContent.split(',')[0].trim() ?? ''
                                : ''
                        if (
                            !company.includes('Die Gattung wird') &&
                            tables[1].cells !== null &&
                            tables.length > 0
                        ) {
                            symbol = tables[1].cells[1].textContent ?? ''
                            result = {
                                company,
                                symbol
                            }
                            resolve(result)
                        } else {
                            const error = new Error(`Request failed: ${secondResponse.statusText}`)
                            await notice([error.message])
                            reject(error)
                        }
                    }
                }
            }
        })
    }

    /**
     * Fetch online values for active companies
     * @param storageOnline - An array of ISINs (active companies)
     * @returns An array with min, rate, max values
     * @throws Error if the request fails or data cannot be parsed
     */
    async function fetchMinRateMaxData(storageOnline: I_Storage_Online[]): Promise<I_Min_Rate_Max_Data[]> {
        log('USE_FETCH: fetchMinRateMaxData')
        return new Promise(async (resolve, reject) => {
            const storageService = await getStorage([BROWSER_STORAGE.PROPS.SERVICE])
            const serviceName = storageService[BROWSER_STORAGE.PROPS.SERVICE] as string
            const _fnet = async (urls: I_Number_String[]): Promise<I_Min_Rate_Max_Data[]> => {
                return await Promise.all(
                    urls.map(async (urlObj: I_Number_String): Promise<I_Min_Rate_Max_Data> => {
                        const firstResponse = await _fetchWithRetry(urlObj.value)
                        const secondResponseText = fetchWithCache(
                            firstResponse.url,
                            firstResponse.url,
                            _fetchWithRetry)
                        const onlineDocument = _parseHTML(await secondResponseText)
                        const onlineNodes = onlineDocument.querySelectorAll('#snapshot-value-fst-current-0 > span')
                        const onlineArticleNodes = onlineDocument.querySelectorAll('main div[class=accordion__content]')
                        let onlineMin = '0'
                        let onlineMax = '0'
                        let onlineCurrency = 'EUR'
                        let onlineRate = '0'
                        if (onlineArticleNodes.length > 0) {
                            const onlineMmNodes =
                                onlineArticleNodes[0].querySelectorAll('table > tbody > tr')
                            for (let i = 0; i < onlineMmNodes.length; i++) {
                                if (onlineMmNodes[i].textContent?.includes('1 Jahr')) {
                                    const tr = onlineMmNodes[i].querySelectorAll('td')
                                    onlineMin =
                                        tr[3].textContent ?? '0'
                                    onlineMax =
                                        tr[4].textContent ?? '0'
                                }
                            }
                        }
                        if (onlineNodes.length > 1) {
                            onlineCurrency = onlineNodes[1].textContent ?? ''
                            onlineRate = onlineNodes[0].textContent ?? ''
                        }
                        return {
                            id: urlObj.key!,
                            isin: '',
                            rate: onlineRate,
                            min: onlineMin,
                            max: onlineMax,
                            cur: onlineCurrency
                        }
                    })
                )
            }
            const _ard = async (urls: I_Number_String[]): Promise<I_Min_Rate_Max_Data[]> => {
                return await Promise.all(
                    urls.map(async (urlObj: I_Number_String): Promise<I_Min_Rate_Max_Data> => {
                        const firstResponseText = fetchWithCache(
                            urlObj.value,
                            urlObj.value,
                            _fetchWithRetry)
                        const firstResponseDocument = _parseHTML(await firstResponseText)
                        const firstResponseRows = firstResponseDocument.querySelectorAll(
                            '#desktopSearchResult > table > tbody > tr'
                        )
                        if (firstResponseRows.length > 0) {
                            const url = firstResponseRows[0].getAttribute('onclick') ?? ''
                            const secondResponse = await fetch(
                                url.replace('document.location=\'', '').replace('\';', '')
                            )
                            const secondResponseText = await secondResponse.text()
                            const onlineDocument = new DOMParser().parseFromString(
                                secondResponseText,
                                'text/html'
                            )
                            const onlineCurrency = 'EUR'
                            const ardRows: NodeListOf<HTMLTableRowElement> =
                                onlineDocument.querySelectorAll(
                                    '#USFkursdaten table > tbody tr'
                                )
                            const onlineRate = (
                                ardRows[0].cells[1].textContent ?? '0'
                            ).replace('€', '')
                            const onlineMin = (
                                ardRows[6].cells[1].textContent ?? '0'
                            ).replace('€', '')
                            const onlineMax = (
                                ardRows[7].cells[1].textContent ?? '0'
                            ).replace('€', '')
                            return {
                                id: urlObj.key!,
                                isin: '',
                                rate: onlineRate,
                                min: onlineMin,
                                max: onlineMax,
                                cur: onlineCurrency
                            }
                        } else {
                            return {
                                id: urlObj.key!,
                                isin: '',
                                rate: '0',
                                min: '0',
                                max: '0',
                                cur: 'EUR'
                            }
                        }
                    })
                )
            }
            const _wstreet = async (urls: I_Number_String[], homeUrl: string): Promise<I_Min_Rate_Max_Data[]> => {
                return await Promise.all(
                    urls.map(async (urlObj: I_Number_String): Promise<I_Min_Rate_Max_Data> => {
                        const firstResponse = await _fetchWithRetry(urlObj.value)
                        const firstResponseJson = await firstResponse.json()
                        const secondResponseText = fetchWithCache(
                            firstResponseJson.result[0].link,
                            homeUrl + firstResponseJson.result[0].link,
                            _fetchWithRetry)
                        const onlineDocument = _parseHTML(await secondResponseText)
                        const onlineRates = onlineDocument.querySelectorAll('div.c2 table')
                        const onlineMinMax = onlineDocument.querySelectorAll('div.fundamental > div > div.float-start')
                        let onlineCurrency = ''
                        const onlineRate =
                            onlineRates[0]
                                ?.querySelectorAll('tr')[1]
                                ?.querySelectorAll('td')[1].textContent ?? '0'
                        const onlineMax = onlineMinMax[1]?.textContent?.split('Hoch')[1] ?? '0'
                        const onlineMin = onlineMinMax[1]?.textContent?.split('Hoch')[0].split('WochenTief')[1] ?? '0'
                        if (onlineRate.includes('USD')) {
                            onlineCurrency = 'USD'
                        } else if (onlineRate.includes('EUR')) {
                            onlineCurrency = 'EUR'
                        }
                        return {
                            id: urlObj.key ?? 0,
                            isin: '',
                            rate: onlineRate,
                            min: onlineMin ?? '',
                            max: onlineMax ?? '',
                            cur: onlineCurrency
                        }
                    })
                )
            }
            const _goyax = async (urls: I_Number_String[]): Promise<I_Min_Rate_Max_Data[]> => {
                return await Promise.all(
                    urls.map(async (urlObj: I_Number_String): Promise<I_Min_Rate_Max_Data> => {
                        const firstResponse = await _fetchWithRetry(urlObj.value)
                        const secondResponseText = fetchWithCache(
                            firstResponse.url,
                            firstResponse.url,
                            _fetchWithRetry)
                        const onlineDocument = _parseHTML(await secondResponseText)
                        const onlineNodes = onlineDocument.querySelectorAll(
                            'div#instrument-ueberblick > div'
                        )
                        const onlineRateNodes =
                            onlineNodes[1].querySelectorAll('ul.list-rows')
                        const onlineRateAll =
                            onlineRateNodes[1].querySelectorAll('li')[3].textContent ?? '0'
                        const onlineRate = onlineRateAll.split(')')[1] ?? '0'
                        const onlineStatisticRows = onlineNodes[0]
                            .querySelectorAll('table')[1]
                            .querySelectorAll('tr')
                        const onlineMax =
                            onlineStatisticRows[4].querySelectorAll('td')[3].textContent ??
                            '0'
                        const onlineMin =
                            onlineStatisticRows[5].querySelectorAll('td')[3].textContent ??
                            '0'
                        const onlineCurrency = 'EUR'
                        return {
                            id: urlObj.key!,
                            isin: '',
                            rate: onlineRate,
                            min: onlineMin,
                            max: onlineMax,
                            cur: onlineCurrency
                        }
                    })
                )
            }
            const _acheck = async (urls: I_Number_String[]): Promise<I_Min_Rate_Max_Data[]> => {
                return await Promise.all(
                    urls.map(async (urlObj: I_Number_String): Promise<I_Min_Rate_Max_Data> => {
                        let onlineCurrency = ''
                        const firstResponse = await _fetchWithRetry(urlObj.value)
                        const secondResponseText = fetchWithCache(
                            firstResponse.url,
                            firstResponse.url,
                            _fetchWithRetry)
                        const onlineDocument = _parseHTML(await secondResponseText)
                        const onlineTables =
                            onlineDocument.querySelectorAll('#content table')
                        if (onlineTables.length > 1) {
                            const onlineRate =
                                onlineTables[0]
                                    .querySelectorAll('tr')[1]
                                    .querySelectorAll('td')[1].textContent ?? '0'
                            const findCurrency =
                                onlineTables[0]
                                    .querySelectorAll('tr')[1]
                                    .querySelectorAll('td')[2].textContent ?? '0'
                            const onlineMin =
                                onlineTables[2]
                                    .querySelectorAll('tr')[3]
                                    .querySelectorAll('td')[2].textContent ?? '0'
                            const onlineMax =
                                onlineTables[2]
                                    .querySelectorAll('tr')[3]
                                    .querySelectorAll('td')[1].textContent ?? '0'
                            if (findCurrency.includes('$')) {
                                onlineCurrency = 'USD'
                            } else if (findCurrency.includes('€')) {
                                onlineCurrency = 'EUR'
                            }
                            return {
                                id: urlObj.key!,
                                isin: '',
                                rate: onlineRate,
                                min: onlineMin,
                                max: onlineMax,
                                cur: onlineCurrency
                            }
                        } else {
                            return {
                                id: -1,
                                isin: '',
                                rate: '0',
                                min: '0',
                                max: '0',
                                cur: 'EUR'
                            }
                        }
                    })
                )
            }
            const _tgate = async (urls: I_Number_String[]): Promise<I_Min_Rate_Max_Data[]> => {
                return await Promise.all(
                    urls.map(async (urlObj: I_Number_String): Promise<I_Min_Rate_Max_Data> => {
                        const firstResponseText = fetchWithCache(
                            urlObj.value,
                            urlObj.value,
                            _fetchWithRetry)
                        const onlineCurrency = 'EUR'
                        const onlineMax = '0'
                        const onlineMin = '0'
                        const onlineDocument = _parseHTML(await firstResponseText)
                        const resultask =
                            onlineDocument.querySelector('#ask') !== null
                                ? onlineDocument.querySelector('#ask')?.textContent
                                : '0'
                        const resultbid =
                            onlineDocument.querySelector('#bid') !== null
                                ? onlineDocument.querySelector('#bid')?.textContent
                                : '0'
                        const quote = mean([toNumber(resultbid), toNumber(resultask)])
                        const onlineRate = quote.toString()
                        return {
                            id: urlObj.key!,
                            isin: '',
                            rate: onlineRate,
                            min: onlineMin,
                            max: onlineMax,
                            cur: onlineCurrency
                        }
                    })
                )
            }
            const _select = async (urls: I_Number_String[]): Promise<I_Min_Rate_Max_Data[]> => {
                return new Promise(async (resolve, reject) => {
                    const service = SERVICES.MAP.get(serviceName)
                    switch (serviceName) {
                        case 'fnet':
                            resolve(await _fnet(urls))
                            break
                        case 'ard':
                            resolve(await _ard(urls))
                            break
                        case 'wstreet':
                            if (service !== undefined) {
                                resolve(await _wstreet(urls, service.HOME))
                            } else {
                                reject(new Error('Unexpected error occurred'))
                            }
                            break
                        case 'goyax':
                            resolve(await _goyax(urls))
                            break
                        case 'acheck':
                            resolve(await _acheck(urls))
                            break
                        case 'tgate':
                            resolve(await _tgate(urls))
                            break
                        default:
                            throw new Error('ONLINE: fetchMinRateMaxData: unknown service!')
                    }
                })
            }

            const urls: I_Number_String[] = []
            if (storageOnline.length > 0) {
                for (let i = 0; i < storageOnline.length; i++) {
                    const service = SERVICES.MAP.get(serviceName)
                    const isin = storageOnline[i].isin
                    if (isin !== undefined && service !== undefined && service !== null) {
                        urls.push(
                            {
                                value: service.QUOTE + isin,
                                key: storageOnline[i].id ?? -1
                            }
                        )
                    }
                }
            } else {
                reject(new Error('System Error'))
            }
            resolve(await _select(urls))
        })
    }

    /**
     * Fetch changes values for the asked list
     * @param table - List identifier
     * @param mode - List selector
     * @returns An array with changes values
     * @throws Error if the request fails or data cannot be parsed
     */
    async function fetchDailyChangeData(table: string, mode = SERVICES.TGATE.CHANGES.SMALL): Promise<I_Daily_Changes_Data[]> {
        log('USE_FETCH: fetchDailyChangesData')
        let valuestr: string
        let company: string
        let url = `${SERVICES.TGATE.CHB_URL}${table}`
        let selector = '#kursliste_abc > tr'
        if (mode === SERVICES.TGATE.CHANGES.SMALL) {
            url = `${SERVICES.TGATE.CHS_URL}${table}`
            selector = '#kursliste_daten > tr'
        }
        const convertHTMLEntities = (str: string | null): string => {
            const entities = new Map(
                [
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
                ]
            )
            const fMatch = (match: string): string => {
                return entities.get(match.substring(1, 4)) ?? ''
            }
            let result = ''
            if (str !== null) {
                result = str
                    .trim()
                    .replace(new RegExp(SYSTEM.HTML_ENTITY, 'g'), fMatch)
            }
            return result
        }
        const entry: I_Daily_Changes_Data = {
            key: '',
            value: {
                percentChange: '',
                change: 0,
                stringChange: ''
            }
        }
        const firstResponse = await _fetchWithRetry(url)
        const _changes: I_Daily_Changes_Data[] = []
        const firstResponseText = await firstResponse.text()
        const sDocument = _parseHTML(firstResponseText)
        const trCollection = sDocument.querySelectorAll(selector)
        for (let i = 0; i < trCollection.length; i++) {
            valuestr = trCollection[i].childNodes[11].textContent ?? ''
            company = convertHTMLEntities(
                trCollection[i].childNodes[1].textContent ?? ''
            ).replace('<wbr>', '')
            entry.key = company.toUpperCase()
            entry.value = {
                percentChange: valuestr.replace(/\t/g, ''),
                change: toNumber(valuestr),
                stringChange: toNumber(valuestr).toString()
            }
            _changes.push({...entry})
        }
        return _changes
    }

    /**
     * Fetch exchanges data
     * @param exchangeCodes - An array of exchange codes to be queried
     * @returns An array exchange values
     * @throws Error if the request fails or data cannot be parsed
     */
    async function fetchExchangesData(exchangeCodes: string[]): Promise<I_Exchange_Data[]> {
        log('USE_FETCH: fetchExchangesData')
        const service = SERVICES.FX
        const fExUrl = (code: string): string => {
            if (service !== undefined) {
                return `${service.QUOTE}${code.substring(0, 3)}&cp_input=${code.substring(3, 6)}&amount_from=1`
            } else {
                throw new Error('Undefined service constant!')
            }
        }
        return new Promise(async (resolve): Promise<I_Exchange_Data[]> => {
            const result: I_Exchange_Data[] = []
            for (let i = 0; i < exchangeCodes.length; i++) {
                const firstResponse = await _fetchWithRetry(fExUrl(exchangeCodes[i]))
                //const firstResponseText = await firstResponse.text()
                const firstResponseText = fetchWithCache(
                    firstResponse.url,
                    firstResponse.url,
                    _fetchWithRetry)
                const resultDocument: Document = _parseHTML(await firstResponseText)
                const resultTr = resultDocument.querySelector(
                    'form#formcalculator.formcalculator > div'
                )
                if (resultTr !== undefined && resultTr !== null) {
                    const resultString = resultTr.getAttribute('data-rate') //?.textContent ?? ''
                    const resultMatchArray = resultString?.match(/[0-9]*\.?[0-9]+/g) ?? ['1']
                    const exchangeRate = Number.parseFloat(resultMatchArray[0])
                    result.push({key: exchangeCodes[i], value: exchangeRate})
                }
            }
            resolve(result)
            return result
        })
    }

    /**
     * Fetch material data
     * @returns An array with material data
     * @throws Error if the request fails or data cannot be parsed
     */
    async function fetchMaterialData(): Promise<I_String_Number[]> {
        log('USE_FETCH: fetchMaterialData')
        return new Promise(async (resolve) => {
            const materials: I_String_Number[] = []
            //const firstResponse = await _fetchWithRetry(SERVICES.FNET.MATERIALS)
            const firstResponseText = fetchWithCache(
                SERVICES.FNET.MATERIALS,
                SERVICES.FNET.MATERIALS,
                _fetchWithRetry)
            //const firstResponseText = await firstResponse.text()
            const resultDocument: Document = _parseHTML(await firstResponseText)
            const resultTr = resultDocument.querySelectorAll(
                '#commodity_prices > table > tbody tr'
            )
            for (let i = 0; i < resultTr.length; i++) {
                const material = resultTr[i].children[0].textContent ?? ''
                if (
                    resultTr[i].children[0].tagName === 'TD' &&
                    material !== undefined
                ) {
                    materials.push(
                        {
                            key: material,
                            value: toNumber(resultTr[i].children[1].textContent)
                        }
                    )
                }
            }
            resolve(materials)
            return materials
        })
    }

    /**
     * Fetch index data
     * @returns An array with index data
     * @throws Error if the request fails or data cannot be parsed
     */
    async function fetchIndexData(): Promise<I_String_Number[]> {
        log('USE_FETCH: fetchIndexData')
        return new Promise(async (resolve) => {
            const indexes: I_String_Number[] = []
            const indexesKeys = SETTINGS.INDEXES.keys()
            //const firstResponse = await _fetchWithRetry(SERVICES.FNET.INDEXES)
            const firstResponseText = fetchWithCache(
                SERVICES.FNET.INDEXES,
                SERVICES.FNET.INDEXES,
                _fetchWithRetry)
            //const firstResponseText = await firstResponse.text()
            const resultDocument: Document = _parseHTML(await firstResponseText)
            const resultTr = resultDocument.querySelectorAll('.index-world-map a')
            indexesKeys.forEach((property) => {
                const indexValue = SETTINGS.INDEXES.get(property)
                for (let j = 0; j < resultTr.length; j++) {
                    if (indexValue?.includes(resultTr[j].getAttribute('title') ?? '') && resultTr[j].children[0].textContent !== undefined) {
                        indexes.push(
                            {
                                key: property,
                                value: toNumber(resultTr[j].children[0].textContent)
                            }
                        )
                    }
                }

            })
            resolve(indexes)
            return indexes
        })
    }

    /**
     * Fetch company dates
     * @param obj - An array of company dates data
     * @returns An array company dates data
     * @throws Error if the request fails or data cannot be parsed
     */
    async function fetchDateData(obj: I_Number_String[]): Promise<I_Date_Data[]> {
        log('USE_FETCH: fetchDatesData')
        //if (obj.length === 0) return Promise.resolve([])
        const gmqf = {gm: 0, qf: 0}
        const parseGermanDate = (germanDateString: string): number => {
            const parts = germanDateString.match(/(\d+)/g) ?? ['01', '01', '1970']
            const year =
                parts.length === 3 && parts[2].length === 4 ? parts[2] : '1970'
            const month = parts.length === 3 ? parts[1].padStart(2, '0') : '01'
            const day = parts.length === 3 ? parts[0].padStart(2, '0') : '01'
            return new Date(`${year}-${month}-${day}`).getTime()
        }
        const promises = obj.map(async (entry: I_Number_String): Promise<I_Date_Data> => {
            const firstResponse = await _fetchWithRetry(`${SERVICES.FNET.SEARCH}${entry.value}`)
            if (firstResponse.ok) {
                const atoms = firstResponse.url.split('/')
                const stockName = atoms[atoms.length - 1].replace('-aktie', '')
                const secondResponseText = fetchWithCache(
                    `${SERVICES.FNET.DATES}${stockName}`,
                    `${SERVICES.FNET.DATES}${stockName}`,
                    _fetchWithRetry)
                const qfgmDocument = _parseHTML(await secondResponseText)
                const tables = qfgmDocument.querySelectorAll('.table')
                const rows = tables[1].querySelectorAll('tr')
                let stopGm = false
                let stopQf = false
                const gmqfString = {gm: '01.01.1970', qf: '01.01.1970'}
                for (let j = 0; j < rows.length && !!(rows[j].cells[3]); j++) {
                    const row = rows[j].cells[3].textContent?.replaceAll('(e)*', '').trim() ?? '01.01.1970'
                    if (
                        rows[j].cells[0].textContent === 'Quartalszahlen' &&
                        row !== '01.01.1970' &&
                        row.length === 10 &&
                        !stopQf
                    ) {
                        gmqfString.qf = row
                        stopQf = true
                    } else if (
                        rows[j].cells[0].textContent === 'Hauptversammlung' &&
                        row !== '01.01.1970' &&
                        row.length === 10 &&
                        !stopGm
                    ) {
                        gmqfString.gm = row
                        stopGm = true
                    }
                    if (stopQf && stopGm) break
                }
                gmqf.qf =
                    gmqfString.qf !== undefined && gmqfString.qf !== ''
                        ? parseGermanDate(gmqfString.qf)
                        : 0
                gmqf.gm =
                    gmqfString.gm !== undefined && gmqfString.gm !== ''
                        ? parseGermanDate(gmqfString.gm)
                        : 0
            }
            return {key: entry.key, value: gmqf}
        })
        return Promise.all(promises)
    }

    return {
        fetchCompanyData,
        fetchMinRateMaxData,
        fetchDailyChangeData,
        fetchExchangesData,
        fetchMaterialData,
        fetchIndexData,
        fetchDateData,
        fetchIsOk
    }
}
