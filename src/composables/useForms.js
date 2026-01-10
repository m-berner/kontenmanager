import { reactive, ref } from 'vue';
import { useAppConfig } from '@/composables/useAppConfig';
const { INDEXED_DB, DATE } = useAppConfig();
function createFormManager(initialData, mapFn) {
    const formularData = reactive({ ...initialData });
    const formRef = ref(null);
    const isDirty = ref(false);
    const isValid = ref(false);
    const initialDataCopy = { ...initialData };
    function reset() {
        Object.assign(formularData, initialDataCopy);
        formRef.value = null;
        isDirty.value = false;
        isValid.value = false;
    }
    return {
        formularData,
        formRef,
        reset,
        mapFormToDb: mapFn,
        isDirty,
        isValid
    };
}
export function useAccountFormular() {
    const initialData = {
        id: -1,
        swift: '',
        iban: '',
        logoUrl: '',
        withDepot: false
    };
    function mapAccountFormToDb(data, id) {
        return {
            cID: id,
            cSwift: data.swift.trim().toUpperCase(),
            cIban: data.iban.replace(/\s/g, '').toUpperCase(),
            cLogoUrl: data.logoUrl.trim(),
            cWithDepot: data.withDepot
        };
    }
    const manager = createFormManager(initialData, mapAccountFormToDb);
    return {
        ...manager,
        accountFormularData: manager.formularData,
        mapAccountFormToDb: (id) => manager.mapFormToDb(manager.formularData, id)
    };
}
export function useStockFormular() {
    const initialData = {
        id: -1,
        isin: '',
        company: '',
        symbol: '',
        meetingDay: '',
        quarterDay: '',
        fadeOut: 0,
        firstPage: 0,
        url: '',
        askDates: DATE.ISO
    };
    function mapStockFormToDb(data, accountId) {
        return {
            cID: data.id,
            cISIN: data.isin.replace(/\s/g, '').toUpperCase(),
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
    }
    const manager = createFormManager(initialData, mapStockFormToDb);
    return {
        ...manager,
        stockFormularData: manager.formularData,
        mapStockFormToDb: (accountId) => manager.mapFormToDb(manager.formularData, accountId)
    };
}
export function useBookingFormular() {
    const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;
    const initialData = {
        id: -1,
        bookDate: '',
        exDate: '',
        credit: 0,
        debit: 0,
        description: '',
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
        marketPlace: ''
    };
    const selected = ref(-1);
    const cdRef = ref(null);
    function mapBookingFormToDb(data, accountId, defaultISODate) {
        const isStockRelated = (typeId) => {
            return [BOOKING_TYPES.BUY, BOOKING_TYPES.SELL, BOOKING_TYPES.DIVIDEND].includes(typeId);
        };
        const isDividend = (typeId) => {
            return typeId === BOOKING_TYPES.DIVIDEND;
        };
        const hasMarketplace = (typeId) => {
            return [BOOKING_TYPES.BUY, BOOKING_TYPES.SELL, BOOKING_TYPES.DIVIDEND].includes(typeId);
        };
        return {
            cID: data.id,
            cAccountNumberID: accountId,
            cBookDate: data.bookDate,
            cCredit: data.credit,
            cDebit: data.debit,
            cDescription: data.description.trim(),
            cBookingTypeID: selected.value,
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
            cMarketPlace: hasMarketplace(data.bookingTypeId) ? data.marketPlace.trim() : ''
        };
    }
    const manager = createFormManager(initialData, mapBookingFormToDb);
    const extendedReset = () => {
        manager.reset();
        selected.value = -1;
        cdRef.value = null;
    };
    return {
        ...manager,
        bookingFormularData: manager.formularData,
        selected,
        cdRef,
        reset: extendedReset,
        mapBookingFormToDb: (accountId, defaultISODate) => manager.mapFormToDb(manager.formularData, accountId, defaultISODate)
    };
}
