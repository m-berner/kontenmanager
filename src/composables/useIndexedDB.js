import { useApp } from '@/composables/useApp';
const { CONS, log, notice } = useApp();
export const useIndexedDB = () => {
    let db = null;
    const dbi = () => {
        return db;
    };
    const clearStores = async () => {
        log('BACKGROUND: clearStores');
        return new Promise(async (resolve, reject) => {
            if (db !== null) {
                const onComplete = async () => {
                    await notice(['Database is empty!']);
                    resolve('BACKGROUND: database is empty!');
                };
                const onAbort = () => {
                    reject(requestTransaction.error);
                };
                const onError = () => {
                    reject(requestTransaction.error);
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.STOCKS.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE);
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onError, CONS.SYSTEM.ONCE);
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE);
                const onSuccessClearBookings = () => {
                    log('BACKGROUND: bookings dropped');
                };
                const onSuccessClearAccounts = () => {
                    log('BACKGROUND: accounts dropped');
                };
                const onSuccessClearBookingTypes = () => {
                    log('BACKGROUND: booking types dropped');
                };
                const onSuccessClearStocks = () => {
                    log('BACKGROUND: stocks dropped');
                };
                const requestClearBookings = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).clear();
                requestClearBookings.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookings, CONS.SYSTEM.ONCE);
                const requestClearAccount = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).clear();
                requestClearAccount.addEventListener(CONS.EVENTS.SUC, onSuccessClearAccounts, CONS.SYSTEM.ONCE);
                const requestClearBookingTypes = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).clear();
                requestClearBookingTypes.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookingTypes, CONS.SYSTEM.ONCE);
                const requestClearStocks = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).clear();
                requestClearStocks.addEventListener(CONS.EVENTS.SUC, onSuccessClearStocks, CONS.SYSTEM.ONCE);
            }
        });
    };
    const exportToFile = async (filename) => {
        log('BACKGROUND: exportToFile');
        const accounts = [];
        const bookings = [];
        const stocks = [];
        const bookingTypes = [];
        return new Promise(async (resolve, reject) => {
            if (db !== null) {
                const onComplete = async () => {
                    log('BACKGROUND: exportToFile: data read!');
                    const stringifyDB = () => {
                        let buffer;
                        let i;
                        buffer = '"accounts":[\n';
                        for (i = 0; i < accounts.length; i++) {
                            buffer += JSON.stringify(accounts[i]);
                            if (i === accounts.length - 1) {
                                buffer += '\n],\n';
                            }
                            else {
                                buffer += ',\n';
                            }
                        }
                        buffer += i === 0 ? '],\n' : '';
                        buffer += '"stocks":[\n';
                        for (i = 0; i < stocks.length; i++) {
                            buffer += JSON.stringify(stocks[i]);
                            if (i === stocks.length - 1) {
                                buffer += '\n],\n';
                            }
                            else {
                                buffer += ',\n';
                            }
                        }
                        buffer += i === 0 ? '],\n' : '';
                        buffer += '"bookingTypes":[\n';
                        for (i = 0; i < bookingTypes.length; i++) {
                            buffer += JSON.stringify(bookingTypes[i]);
                            if (i === bookingTypes.length - 1) {
                                buffer += '\n],\n';
                            }
                            else {
                                buffer += ',\n';
                            }
                        }
                        buffer += i === 0 ? '],\n' : '';
                        buffer += '"bookings":[\n';
                        for (i = 0; i < bookings.length; i++) {
                            buffer += JSON.stringify(bookings[i]);
                            if (i === bookings.length - 1) {
                                buffer += '\n]\n';
                            }
                            else {
                                buffer += ',\n';
                            }
                        }
                        return buffer;
                    };
                    let buffer = `{\n"sm": {"cVersion":${browser.runtime.getManifest().version.replace(/\./g, '')}, "cDBVersion":${CONS.DB.CURRENT_VERSION}, "cEngine":"indexeddb"},\n`;
                    buffer += stringifyDB();
                    buffer += '}';
                    const blob = new Blob([buffer], { type: 'application/json' });
                    const blobUrl = URL.createObjectURL(blob);
                    const op = {
                        url: blobUrl,
                        filename
                    };
                    const onDownloadChange = (change) => {
                        log('BACKGROUND: onDownloadChange');
                        browser.downloads.onChanged.removeListener(onDownloadChange);
                        if ((change.state !== undefined && change.id > 0) ||
                            (change.state !== undefined && change.state.current === CONS.EVENTS.COMP)) {
                            URL.revokeObjectURL(blobUrl);
                        }
                    };
                    browser.downloads.onChanged.addListener(onDownloadChange);
                    await browser.downloads.download(op);
                    await notice(['Database exported!']);
                    resolve('BACKGROUND: exportToFile: done!');
                };
                const onAbort = () => {
                    reject(requestTransaction.error);
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.STOCKS.NAME], 'readonly');
                requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE);
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE);
                const onSuccessAccountOpenCursor = (ev) => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        accounts.push(ev.target.result.value);
                        ev.target.result.continue();
                    }
                };
                const onSuccessBookingTypeOpenCursor = (ev) => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        bookingTypes.push(ev.target.result.value);
                        ev.target.result.continue();
                    }
                };
                const onSuccessBookingOpenCursor = (ev) => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        bookings.push(ev.target.result.value);
                        ev.target.result.continue();
                    }
                };
                const onSuccessStockOpenCursor = (ev) => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        stocks.push(ev.target.result.value);
                        ev.target.result.continue();
                    }
                };
                const requestAccountOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).openCursor();
                requestAccountOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessAccountOpenCursor, false);
                const requestBookingTypeOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).openCursor();
                requestBookingTypeOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingTypeOpenCursor, false);
                const requestBookingOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).openCursor();
                requestBookingOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingOpenCursor, false);
                const requestStockOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).openCursor();
                requestStockOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessStockOpenCursor, false);
            }
        });
    };
    const exportStores = async (aid) => {
        log('BACKGROUND: exportStores');
        const accounts = [];
        const bookings = [];
        const stocks = [];
        const bookingTypes = [];
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onComplete = async () => {
                    log('BACKGROUND: exportStores: all database records sent to frontend!');
                    resolve({ accounts, bookings, stocks, bookingTypes });
                };
                const onAbort = () => {
                    reject(requestTransaction.error);
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.STOCKS.NAME], 'readonly');
                requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE);
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE);
                const onSuccessAccountOpenCursor = (ev) => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        accounts.push(ev.target.result.value);
                        ev.target.result.continue();
                    }
                };
                const onSuccessBookingTypeOpenCursor = (ev) => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        if (ev.target.result.value.cAccountNumberID === aid) {
                            bookingTypes.push(ev.target.result.value);
                        }
                        ev.target.result.continue();
                    }
                };
                const onSuccessBookingOpenCursor = (ev) => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        if (ev.target.result.value.cAccountNumberID === aid) {
                            bookings.push(ev.target.result.value);
                        }
                        ev.target.result.continue();
                    }
                };
                const onSuccessStockOpenCursor = (ev) => {
                    if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                        if (ev.target.result.value.cAccountNumberID === aid) {
                            stocks.push(ev.target.result.value);
                        }
                        ev.target.result.continue();
                    }
                };
                const requestAccountOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).openCursor();
                requestAccountOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessAccountOpenCursor, false);
                const requestBookingTypeOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).openCursor();
                requestBookingTypeOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingTypeOpenCursor, false);
                const requestBookingOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).openCursor();
                requestBookingOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingOpenCursor, false);
                const requestStockOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).openCursor();
                requestStockOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessStockOpenCursor, false);
            }
        });
    };
    const importStores = async (stores, all = true) => {
        log('BACKGROUND: importStores', { info: db });
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onComplete = async () => {
                    await notice(['All memory records are added to the database!']);
                    resolve('BACKGROUND: importStores: all memory records are added to the database!');
                };
                const onAbort = () => {
                    reject(requestTransaction.error);
                };
                const onError = (ev) => {
                    reject(ev);
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.STOCKS.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE);
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onError, CONS.SYSTEM.ONCE);
                requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE);
                const onSuccessClearBookings = () => {
                    log('BACKGROUND: bookings dropped');
                    for (let i = 0; i < stores.bookings.length; i++) {
                        requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).add({ ...stores.bookings[i] });
                    }
                };
                const onSuccessClearAccounts = () => {
                    log('BACKGROUND: accounts dropped');
                    for (let i = 0; i < stores.accounts.length; i++) {
                        requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).add({ ...stores.accounts[i] });
                    }
                };
                const onSuccessClearBookingTypes = () => {
                    log('BACKGROUND: booking types dropped');
                    for (let i = 0; i < stores.bookingTypes.length; i++) {
                        requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).add({ ...stores.bookingTypes[i] });
                    }
                };
                const onSuccessClearStocks = () => {
                    log('BACKGROUND: stocks dropped');
                    for (let i = 0; i < stores.stocks.length; i++) {
                        requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).add({ ...stores.stocks[i] });
                    }
                };
                const requestClearBookings = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).clear();
                requestClearBookings.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookings, CONS.SYSTEM.ONCE);
                if (all) {
                    const requestClearAccount = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).clear();
                    requestClearAccount.addEventListener(CONS.EVENTS.SUC, onSuccessClearAccounts, CONS.SYSTEM.ONCE);
                }
                const requestClearBookingTypes = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).clear();
                requestClearBookingTypes.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookingTypes, CONS.SYSTEM.ONCE);
                const requestClearStocks = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).clear();
                requestClearStocks.addEventListener(CONS.EVENTS.SUC, onSuccessClearStocks, CONS.SYSTEM.ONCE);
            }
        });
    };
    const open = async () => {
        return new Promise(async (resolve, reject) => {
            const onError = (ev) => {
                reject(ev);
            };
            const onSuccess = (ev) => {
                if (ev.target instanceof IDBOpenDBRequest && ev.target.result) {
                    db = ev.target.result;
                    const onVersionChangeSuccess = () => {
                        if (db != null) {
                            db.close();
                            notice(['Database is outdated, please reload the page.']);
                        }
                    };
                    db.addEventListener('versionchange', onVersionChangeSuccess, CONS.SYSTEM.ONCE);
                    resolve('BACKGROUND: database opened successfully!');
                }
            };
            const openDBRequest = indexedDB.open(CONS.DB.NAME, CONS.DB.CURRENT_VERSION);
            log('BACKGROUND: open: database ready', { info: db });
            openDBRequest.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            openDBRequest.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
        });
    };
    const addAccount = async (record) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = async (ev) => {
                    if (ev.target instanceof IDBRequest) {
                        resolve(ev.target.result);
                    }
                };
                const onError = (ev) => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message);
                    }
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).add(record);
                requestAdd.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    const updateAccount = async (record) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = async (ev) => {
                    if (ev.target instanceof IDBRequest) {
                        resolve('Account updated');
                    }
                };
                const onError = (ev) => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message);
                    }
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                const requestUpdate = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).put(record);
                requestUpdate.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                requestUpdate.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    const deleteAccount = async (id) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = () => {
                    resolve('Account deleted');
                };
                const onError = (ev) => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message);
                    }
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).delete(id);
                requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    const addBookingType = async (record) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = (ev) => {
                    if (ev.target instanceof IDBRequest) {
                        resolve(ev.target.result);
                    }
                };
                const onError = (ev) => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message);
                    }
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKING_TYPES.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).add(record);
                requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    const deleteBookingType = async (id) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = () => {
                    resolve('Booking type deleted');
                };
                const onError = (ev) => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message);
                    }
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKING_TYPES.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).delete(id);
                requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    const addBooking = async (record) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = (ev) => {
                    if (ev.target instanceof IDBRequest) {
                        resolve(ev.target.result);
                    }
                };
                const onError = (ev) => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message);
                    }
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).add(record);
                requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    const updateBooking = async (record) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = async (ev) => {
                    if (ev.target instanceof IDBRequest) {
                        resolve('Booking updated');
                    }
                };
                const onError = (ev) => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev);
                    }
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite');
                const requestUpdate = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).put(record);
                requestUpdate.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                requestUpdate.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    const deleteBooking = async (id) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = () => {
                    resolve('Booking deleted');
                };
                const onError = (ev) => {
                    reject(ev);
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).delete(id);
                requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    const addStock = async (record) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = (ev) => {
                    if (ev.target instanceof IDBRequest) {
                        resolve(ev.target.result);
                    }
                };
                const onError = (ev) => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message);
                    }
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.STOCKS.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).add(record);
                requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    const updateStock = async (record) => {
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = async (ev) => {
                    if (ev.target instanceof IDBRequest) {
                        resolve('Stock updated');
                    }
                };
                const onError = (ev) => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev);
                    }
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.STOCKS.NAME], 'readwrite');
                const requestUpdate = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).put(record);
                requestUpdate.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                requestUpdate.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    const deleteStock = async (id) => {
        log('BACKGROUND: deleteStock');
        return new Promise(async (resolve, reject) => {
            if (db != null) {
                const onSuccess = () => {
                    resolve('Stock deleted');
                    return;
                };
                const onError = (ev) => {
                    if (ev instanceof ErrorEvent) {
                        reject(ev.message);
                    }
                    return;
                };
                const requestTransaction = db.transaction([CONS.DB.STORES.STOCKS.NAME], 'readwrite');
                requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).delete(id);
                requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
            }
        });
    };
    return {
        dbi,
        clearStores,
        exportToFile,
        exportStores,
        importStores,
        open,
        addAccount,
        updateAccount,
        deleteAccount,
        addBookingType,
        deleteBookingType,
        addBooking,
        updateBooking,
        deleteBooking,
        addStock,
        updateStock,
        deleteStock
    };
};
