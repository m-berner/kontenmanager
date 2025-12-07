import { reactive, ref } from 'vue';
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
const reset = () => {
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
    formRef.value = null;
};
export function useBookingFormular() {
    return {
        formRef,
        bookingFormularData,
        selected,
        reset
    };
}
