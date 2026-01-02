import { reactive, ref } from 'vue';
import { useAppConfig } from '@/composables/useAppConfig';
const { INDEXED_DB } = useAppConfig();
const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;
const bookingFormularData = reactive({
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
});
const selected = ref(-1);
const formRef = ref(null);
const cdRef = ref(null);
function reset() {
    Object.assign(bookingFormularData, {
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
    });
    selected.value = -1;
}
function mapBookingFormToDb(accountId, defaultISODate) {
    const isStockRelated = (bookingTypeId) => {
        return bookingTypeId === BOOKING_TYPES.BUY || bookingTypeId === BOOKING_TYPES.SELL || bookingTypeId === BOOKING_TYPES.DIVIDEND;
    };
    const isDividendBooking = (bookingTypeId) => {
        return bookingTypeId === BOOKING_TYPES.DIVIDEND;
    };
    const hasMarketplace = (bookingTypeId) => {
        return bookingTypeId === BOOKING_TYPES.BUY || bookingTypeId === BOOKING_TYPES.SELL || bookingTypeId === BOOKING_TYPES.DIVIDEND;
    };
    const base = {
        cID: bookingFormularData.id,
        cAccountNumberID: accountId,
        cBookDate: bookingFormularData.bookDate,
        cCredit: bookingFormularData.credit,
        cDebit: bookingFormularData.debit,
        cDescription: bookingFormularData.description,
        cBookingTypeID: selected.value,
        cSoliCredit: bookingFormularData.soliCredit,
        cSoliDebit: bookingFormularData.soliDebit,
        cTaxCredit: bookingFormularData.taxCredit,
        cTaxDebit: bookingFormularData.taxDebit,
        cFeeCredit: bookingFormularData.feeCredit,
        cFeeDebit: bookingFormularData.feeDebit,
        cSourceTaxCredit: bookingFormularData.sourceTaxCredit,
        cSourceTaxDebit: bookingFormularData.sourceTaxDebit,
        cTransactionTaxCredit: bookingFormularData.transactionTaxCredit,
        cTransactionTaxDebit: bookingFormularData.transactionTaxDebit
    };
    const stockRelated = isStockRelated(bookingFormularData.bookingTypeId);
    const isDividend = isDividendBooking(bookingFormularData.bookingTypeId);
    const hasMP = hasMarketplace(bookingFormularData.bookingTypeId);
    return {
        ...base,
        cStockID: stockRelated ? bookingFormularData.stockId : 0,
        cCount: stockRelated ? bookingFormularData.count : 0,
        cExDate: isDividend ? bookingFormularData.exDate : defaultISODate,
        cMarketPlace: hasMP ? bookingFormularData.marketPlace : ''
    };
}
export function useBookingFormular() {
    return {
        formRef,
        cdRef,
        bookingFormularData,
        selected,
        mapBookingFormToDb,
        reset
    };
}
