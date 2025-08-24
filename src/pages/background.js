import { useApp } from '@/composables/useApp';
import { useDatabase } from '@/composables/useDatabase';
import { useFetch } from '@/composables/useFetch';
const { CONS, log } = useApp();
if (window.document.location.href.includes(CONS.PAGES.BACKGROUND)) {
    const { clearStores, exportToFile, addAccount, updateAccount, deleteAccount, addBooking, deleteBooking, addBookingType, deleteBookingType, addStock, updateStock, updateBooking, exportStores, importStores, deleteStock, open } = useDatabase();
    const { fetchCompanyData, fetchMinRateMaxData, fetchDailyChangeData, fetchExchangesData, fetchMaterialData, fetchIndexData, fetchDateData } = useFetch();
    const onInstall = async () => {
        console.log('BACKGROUND: onInstall');
        const installStorageLocal = async () => {
            const storageLocal = await browser.storage.local.get();
            if (storageLocal[CONS.STORAGE.PROPS.SKIN] === undefined) {
                await browser.storage.local.set({ [CONS.STORAGE.PROPS.SKIN]: CONS.DEFAULTS.STORAGE.SKIN });
            }
            if (storageLocal[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID] === undefined) {
                await browser.storage.local.set({ [CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: CONS.DEFAULTS.STORAGE.ACTIVE_ACCOUNT_ID });
            }
            if (storageLocal[CONS.STORAGE.PROPS.BOOKINGS_PER_PAGE] === undefined) {
                await browser.storage.local.set({ [CONS.STORAGE.PROPS.BOOKINGS_PER_PAGE]: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE });
            }
            if (storageLocal[CONS.STORAGE.PROPS.STOCKS_PER_PAGE] === undefined) {
                await browser.storage.local.set({ [CONS.STORAGE.PROPS.STOCKS_PER_PAGE]: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE });
            }
            if (storageLocal[CONS.STORAGE.PROPS.PARTNER] === undefined) {
                await browser.storage.local.set({ [CONS.STORAGE.PROPS.PARTNER]: CONS.DEFAULTS.STORAGE.PARTNER });
            }
            if (storageLocal[CONS.STORAGE.PROPS.SERVICE] === undefined) {
                await browser.storage.local.set({ [CONS.STORAGE.PROPS.SERVICE]: CONS.DEFAULTS.STORAGE.SERVICE });
            }
            if (storageLocal[CONS.STORAGE.PROPS.EXCHANGES] === undefined) {
                await browser.storage.local.set({ [CONS.STORAGE.PROPS.EXCHANGES]: CONS.DEFAULTS.STORAGE.EXCHANGES });
            }
            if (storageLocal[CONS.STORAGE.PROPS.INDEXES] === undefined) {
                await browser.storage.local.set({ [CONS.STORAGE.PROPS.INDEXES]: CONS.DEFAULTS.STORAGE.INDEXES });
            }
            if (storageLocal[CONS.STORAGE.PROPS.MARKETS] === undefined) {
                await browser.storage.local.set({ [CONS.STORAGE.PROPS.MARKETS]: CONS.DEFAULTS.STORAGE.MARKETS });
            }
            if (storageLocal[CONS.STORAGE.PROPS.MATERIALS] === undefined) {
                await browser.storage.local.set({ [CONS.STORAGE.PROPS.MATERIALS]: CONS.DEFAULTS.STORAGE.MATERIALS });
            }
            console.log('BACKGROUND: installStorageLocal: DONE');
        };
        const onSuccess = (ev) => {
            if (ev.target instanceof IDBRequest) {
                ev.target.result.close();
            }
            console.log('BACKGROUND: onInstall: DONE');
        };
        const onError = (ev) => {
            console.error('BACKGROUND: onError: ', ev);
        };
        const onUpgradeNeeded = async (ev) => {
            if (ev instanceof IDBVersionChangeEvent) {
                console.info('BACKGROUND: onInstall: onUpgradeNeeded', ev.newVersion);
                const createDB = () => {
                    console.log('BACKGROUND: onInstall: onUpgradeNeeded: createDB');
                    const requestCreateAccountStore = dbOpenRequest.result.createObjectStore(CONS.DB.STORES.ACCOUNTS.NAME, {
                        keyPath: CONS.DB.STORES.ACCOUNTS.FIELDS.ID,
                        autoIncrement: true
                    });
                    const requestCreateBookingStore = dbOpenRequest.result.createObjectStore(CONS.DB.STORES.BOOKINGS.NAME, {
                        keyPath: CONS.DB.STORES.BOOKINGS.FIELDS.ID,
                        autoIncrement: true
                    });
                    const requestCreateBookingTypeStore = dbOpenRequest.result.createObjectStore(CONS.DB.STORES.BOOKING_TYPES.NAME, {
                        keyPath: CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID,
                        autoIncrement: true
                    });
                    const requestCreateStockStore = dbOpenRequest.result.createObjectStore(CONS.DB.STORES.STOCKS.NAME, {
                        keyPath: CONS.DB.STORES.STOCKS.FIELDS.ID,
                        autoIncrement: true
                    });
                    requestCreateAccountStore.createIndex(`${CONS.DB.STORES.ACCOUNTS.NAME}_uk1`, CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER, { unique: true });
                    requestCreateBookingTypeStore.createIndex(`${CONS.DB.STORES.BOOKING_TYPES.NAME}_k1`, CONS.DB.STORES.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k1`, CONS.DB.STORES.BOOKINGS.FIELDS.DATE, { unique: false });
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k2`, CONS.DB.STORES.BOOKINGS.FIELDS.BOOKING_TYPE_ID, { unique: false });
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k3`, CONS.DB.STORES.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k4`, CONS.DB.STORES.BOOKINGS.FIELDS.STOCK_ID, { unique: false });
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk1`, CONS.DB.STORES.STOCKS.FIELDS.ISIN, { unique: true });
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk2`, CONS.DB.STORES.STOCKS.FIELDS.SYMBOL, { unique: true });
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k1`, CONS.DB.STORES.STOCKS.FIELDS.FADE_OUT, { unique: false });
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k2`, CONS.DB.STORES.STOCKS.FIELDS.FIRST_PAGE, { unique: false });
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k3`, CONS.DB.STORES.STOCKS.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
                };
                if (ev.oldVersion === 0) {
                    createDB();
                }
                else if (ev.oldVersion > 25) {
                }
                await installStorageLocal();
            }
        };
        const dbOpenRequest = indexedDB.open(CONS.DB.NAME, CONS.DB.CURRENT_VERSION);
        dbOpenRequest.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
        dbOpenRequest.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
        dbOpenRequest.addEventListener(CONS.EVENTS.UPG, onUpgradeNeeded, CONS.SYSTEM.ONCE);
    };
    const onClick = async () => {
        log('BACKGROUND: onClick');
        await open();
        const foundTabs = await browser.tabs.query({ url: `${browser.runtime.getURL(CONS.SYSTEM.INDEX)}` });
        if (foundTabs.length === 0) {
            const extensionTab = await browser.tabs.create({
                url: browser.runtime.getURL(CONS.SYSTEM.INDEX),
                active: true
            });
            const extensionTabIdStr = (extensionTab.id ?? -1).toString();
            sessionStorage.setItem('sExtensionTabId', extensionTabIdStr);
        }
        else {
            await browser.windows.update(foundTabs[0].windowId ?? 0, {
                focused: true
            });
            await browser.tabs.update(foundTabs[0].id ?? 0, { active: true });
        }
    };
    const onAppMessage = async (appMsg) => {
        log('BACKGROUND: onAppMessage', { info: appMsg });
        return new Promise(async (resolve, reject) => {
            const appMessage = JSON.parse(appMsg);
            let response;
            switch (appMessage.type) {
                case CONS.MESSAGES.DB__DELETE_ALL:
                    await clearStores();
                    resolve('DB empty');
                    break;
                case CONS.MESSAGES.DB__EXPORT:
                    await exportToFile(appMessage.data);
                    resolve('DB exported');
                    break;
                case CONS.MESSAGES.DB__GET_STORES:
                    const stores = await exportStores(appMessage.data);
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__GET_STORES__RESPONSE,
                        data: stores
                    });
                    resolve(response);
                    break;
                case CONS.MESSAGES.DB__ADD_STORES_25:
                    const importStoresData25 = appMessage.data;
                    await importStores(importStoresData25, false);
                    await browser.storage.local.set({ [CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: importStoresData25.accounts[0].cID });
                    resolve('Stores added');
                    break;
                case CONS.MESSAGES.DB__ADD_STORES:
                    const importStoresData = appMessage.data;
                    await importStores(importStoresData);
                    await browser.storage.local.set({ [CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: importStoresData.accounts[0].cID });
                    resolve('Stores added');
                    break;
                case CONS.MESSAGES.DB__ADD_ACCOUNT:
                    const addAccountData = appMessage.data;
                    const addAccountID = await addAccount(addAccountData);
                    if (typeof addAccountID === 'number') {
                        const completeAccount = { cID: addAccountID, ...addAccountData };
                        response = JSON.stringify({
                            data: completeAccount
                        });
                        await browser.storage.local.set({ [CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: addAccountID });
                        resolve(response);
                    }
                    break;
                case CONS.MESSAGES.DB__ADD_BOOKING:
                    const addBookingData = appMessage.data;
                    const addBookingID = await addBooking(addBookingData);
                    if (typeof addBookingID === 'number') {
                        const completeBooking = { cID: addBookingID, ...addBookingData };
                        response = JSON.stringify({
                            type: CONS.MESSAGES.DB__ADD_BOOKING__RESPONSE,
                            data: completeBooking
                        });
                        resolve(response);
                    }
                    break;
                case CONS.MESSAGES.DB__ADD_BOOKING_TYPE:
                    const addBookingTypeData = appMessage.data;
                    const addBookingTypeID = await addBookingType(addBookingTypeData);
                    if (typeof addBookingTypeID === 'number') {
                        const completeBookingType = { cID: addBookingTypeID, ...addBookingTypeData };
                        response = JSON.stringify({
                            type: CONS.MESSAGES.DB__ADD_BOOKING_TYPE__RESPONSE,
                            data: completeBookingType
                        });
                        resolve(response);
                    }
                    break;
                case CONS.MESSAGES.DB__ADD_STOCK:
                    const addStockData = appMessage.data;
                    const addStockID = await addStock(addStockData);
                    if (typeof addStockID === 'number') {
                        const completeStock = { cID: addStockID, ...addStockData };
                        response = JSON.stringify({
                            type: CONS.MESSAGES.DB__ADD_STOCK__RESPONSE,
                            data: completeStock
                        });
                        resolve(response);
                    }
                    else {
                        reject('Wrong ID type');
                    }
                    break;
                case CONS.MESSAGES.DB__UPDATE_ACCOUNT:
                    await updateAccount(appMessage.data);
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__UPDATE_ACCOUNT__RESPONSE
                    });
                    resolve(response);
                    break;
                case CONS.MESSAGES.DB__UPDATE_STOCK:
                    const updateStockResponse = await updateStock(appMessage.data);
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__UPDATE_STOCK__RESPONSE,
                        data: updateStockResponse
                    });
                    resolve(response);
                    break;
                case CONS.MESSAGES.DB__UPDATE_BOOKING:
                    const updateBookingResponse = await updateBooking(appMessage.data);
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__UPDATE_BOOKING__RESPONSE,
                        data: updateBookingResponse
                    });
                    resolve(response);
                    break;
                case CONS.MESSAGES.DB__DELETE_ACCOUNT:
                    await deleteAccount(appMessage.data);
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__DELETE_ACCOUNT__RESPONSE
                    });
                    resolve(response);
                    break;
                case CONS.MESSAGES.DB__DELETE_STOCK:
                    await deleteStock(appMessage.data);
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__DELETE_STOCK__RESPONSE
                    });
                    resolve(response);
                    break;
                case CONS.MESSAGES.DB__DELETE_BOOKING:
                    await deleteBooking(appMessage.data);
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__DELETE_BOOKING__RESPONSE
                    });
                    resolve(response);
                    break;
                case CONS.MESSAGES.DB__DELETE_BOOKING_TYPE:
                    await deleteBookingType(appMessage.data);
                    response = JSON.stringify({
                        type: CONS.MESSAGES.DB__DELETE_BOOKING_TYPE__RESPONSE
                    });
                    resolve(response);
                    break;
                case CONS.MESSAGES.FETCH__MIN_RATE_MAX_DATA:
                    const fetchedMinRateMaxData = await fetchMinRateMaxData(appMessage.data);
                    response = JSON.stringify({ data: fetchedMinRateMaxData });
                    resolve(response);
                    break;
                case CONS.MESSAGES.FETCH__COMPANY_DATA:
                    const fetchedCompanyData = await fetchCompanyData(appMessage.data);
                    response = JSON.stringify({ data: fetchedCompanyData });
                    resolve(response);
                    break;
                case CONS.MESSAGES.FETCH__EXCHANGES_BASE_DATA:
                    const fetchedExchangesBaseData = await fetchExchangesData(appMessage.data);
                    response = JSON.stringify({ data: fetchedExchangesBaseData });
                    resolve(response);
                    break;
                case CONS.MESSAGES.FETCH__EXCHANGES_DATA:
                    const fetchedExchangesData = await fetchExchangesData(appMessage.data);
                    response = JSON.stringify({ data: fetchedExchangesData });
                    resolve(response);
                    break;
                case CONS.MESSAGES.FETCH__MATERIALS_DATA:
                    const fetchedMaterialsData = await fetchMaterialData();
                    response = JSON.stringify({ data: fetchedMaterialsData });
                    resolve(response);
                    break;
                case CONS.MESSAGES.FETCH__INDEXES_DATA:
                    const fetchedIndexesData = await fetchIndexData();
                    response = JSON.stringify({ data: fetchedIndexesData });
                    resolve(response);
                    break;
                case CONS.MESSAGES.FETCH__DATES_DATA:
                    const fetchedDatesData = await fetchDateData(appMessage.data);
                    response = JSON.stringify({ data: fetchedDatesData });
                    resolve(response);
                    break;
                case CONS.MESSAGES.FETCH__DAILY_CHANGES_DATA:
                    const fetchedDailyChangesData = await fetchDailyChangeData(appMessage.data);
                    response = JSON.stringify({ data: fetchedDailyChangesData });
                    resolve(response);
                    break;
                default:
                    console.error('Missing message type');
                    reject('Missing message type');
            }
        });
    };
    browser.runtime.onInstalled.addListener(onInstall);
    browser.action.onClicked.addListener(onClick);
    browser.runtime.onMessage.addListener(onAppMessage);
    log('--- PAGE_SCRIPT background.js ---', { info: window.document.location.href });
}
log('--- PAGE_SCRIPT background.js ---');
