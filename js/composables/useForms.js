import { reactive } from "vue";
import { INDEXED_DB } from "@/configs/database";
import { DATE } from "@/domains/configs/date";
import { DomainUtils } from "@/domains/utils";
let stockFormManagerInstance = null;
let accountFormManagerInstance = null;
let bookingFormManagerInstance = null;
let bookingTypeFormManagerInstance = null;
function createFormManager(initialData, mapFn) {
    const formData = reactive({ ...initialData });
    function reset() {
        Object.assign(formData, { ...initialData });
    }
    return {
        formData,
        reset,
        mapFormToDb: mapFn
    };
}
function createStockFormManager() {
    const initialData = {
        id: -1,
        isin: "",
        company: "",
        symbol: "",
        meetingDay: "",
        quarterDay: "",
        fadeOut: 0,
        firstPage: 0,
        url: "",
        askDates: DATE.ISO
    };
    function mapStockFormToDb(data, accountId) {
        const stock = {
            cISIN: data.isin.replace(/\s/g, "").toUpperCase(),
            cCompany: data.company.trim(),
            cSymbol: data.symbol.trim().toUpperCase(),
            cMeetingDay: data.meetingDay,
            cQuarterDay: data.quarterDay,
            cFadeOut: data.fadeOut ? 1 : 0,
            cFirstPage: data.firstPage ? 1 : 0,
            cURL: data.url.trim(),
            cAccountNumberID: accountId,
            cAskDates: data.askDates
        };
        if (data.id > 0) {
            return { cID: data.id, ...stock };
        }
        return stock;
    }
    const manager = createFormManager(initialData, mapStockFormToDb);
    return {
        ...manager,
        stockFormData: manager.formData,
        mapStockFormToDb: (accountId) => manager.mapFormToDb(manager.formData, accountId)
    };
}
function createAccountFormManager() {
    const initialData = {
        id: -1,
        swift: "",
        iban: "",
        logoUrl: "",
        withDepot: false
    };
    function mapAccountFormToDb(data) {
        const account = {
            cSwift: data.swift.trim().toUpperCase(),
            cIban: data.iban.replace(/\s/g, "").toUpperCase(),
            cLogoUrl: data.logoUrl.trim(),
            cWithDepot: data.withDepot
        };
        if (data.id > 0) {
            return { cID: data.id, ...account };
        }
        return account;
    }
    const manager = createFormManager(initialData, mapAccountFormToDb);
    return {
        ...manager,
        accountFormData: manager.formData,
        mapAccountFormToDb: (id) => manager.mapFormToDb(manager.formData, id)
    };
}
function createBookingFormManager() {
    const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;
    const initialData = {
        id: -1,
        selected: -1,
        bookDate: "",
        exDate: "",
        credit: 0,
        debit: 0,
        description: "",
        count: 0,
        bookingTypeId: 0,
        accountTypeId: 0,
        stockId: 0,
        sourceTaxCredit: 0,
        sourceTaxDebit: 0,
        transactionTaxCredit: 0,
        transactionTaxDebit: 0,
        taxCredit: 0,
        taxDebit: 0,
        feeCredit: 0,
        feeDebit: 0,
        soliCredit: 0,
        soliDebit: 0,
        marketPlace: ""
    };
    function mapBookingFormToDb(data, accountId, defaultISODate) {
        const isStockRelated = (typeId) => {
            return [
                BOOKING_TYPES.BUY,
                BOOKING_TYPES.SELL,
                BOOKING_TYPES.DIVIDEND
            ].includes(typeId);
        };
        const isDividend = (typeId) => {
            return typeId === BOOKING_TYPES.DIVIDEND;
        };
        const hasMarketplace = (typeId) => {
            return [
                BOOKING_TYPES.BUY,
                BOOKING_TYPES.SELL,
                BOOKING_TYPES.DIVIDEND
            ].includes(typeId);
        };
        const booking = {
            cAccountNumberID: accountId,
            cBookDate: data.bookDate,
            cCredit: data.credit,
            cDebit: data.debit,
            cDescription: data.description.trim(),
            cBookingTypeID: data.selected,
            cSoliCredit: data.soliCredit,
            cSoliDebit: data.soliDebit,
            cTaxCredit: data.taxCredit,
            cTaxDebit: data.taxDebit,
            cFeeCredit: data.feeCredit,
            cFeeDebit: data.feeDebit,
            cSourceTaxCredit: data.sourceTaxCredit,
            cSourceTaxDebit: data.sourceTaxDebit,
            cTransactionTaxCredit: data.transactionTaxCredit,
            cTransactionTaxDebit: data.transactionTaxDebit,
            cStockID: isStockRelated(data.bookingTypeId) ? data.stockId : 0,
            cCount: isStockRelated(data.bookingTypeId) ? data.count : 0,
            cExDate: isDividend(data.bookingTypeId) ? data.exDate : defaultISODate,
            cMarketPlace: hasMarketplace(data.bookingTypeId)
                ? data.marketPlace.trim()
                : ""
        };
        if (data.id > 0) {
            return { cID: data.id, ...booking };
        }
        return booking;
    }
    const manager = createFormManager(initialData, mapBookingFormToDb);
    return {
        ...manager,
        bookingFormData: manager.formData,
        mapBookingFormToDb: (accountId, defaultISODate) => manager.mapFormToDb(manager.formData, accountId, defaultISODate)
    };
}
function createBookingTypeFormManager() {
    const initialData = {
        id: null,
        name: ""
    };
    function mapBookingTypeFormToDb(data, accountId) {
        const bookingType = {
            cName: DomainUtils.normalizeBookingTypeName(data.name),
            cAccountNumberID: accountId
        };
        if (!data.id)
            return bookingType;
        if (data.id > 0)
            return { cID: data.id, ...bookingType };
        return bookingType;
    }
    const manager = createFormManager(initialData, mapBookingTypeFormToDb);
    return {
        ...manager,
        bookingTypeFormData: manager.formData,
        mapBookingTypeFormToDb: (id) => manager.mapFormToDb(manager.formData, id)
    };
}
export function useAccountForm() {
    if (!accountFormManagerInstance) {
        accountFormManagerInstance = createAccountFormManager();
    }
    return accountFormManagerInstance;
}
export function useStockForm() {
    if (!stockFormManagerInstance) {
        stockFormManagerInstance = createStockFormManager();
    }
    return stockFormManagerInstance;
}
export function useBookingForm() {
    if (!bookingFormManagerInstance) {
        bookingFormManagerInstance = createBookingFormManager();
    }
    return bookingFormManagerInstance;
}
export function useBookingTypeForm() {
    if (!bookingTypeFormManagerInstance) {
        bookingTypeFormManagerInstance = createBookingTypeFormManager();
    }
    return bookingTypeFormManagerInstance;
}
DomainUtils.log("COMPOSABLE useForms");
