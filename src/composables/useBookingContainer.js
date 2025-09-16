import { reactive } from 'vue';
export const useBookingContainer = () => {
    const formData = reactive({
        id: 0,
        bookDate: '',
        exDate: '',
        credit: 0,
        debit: 0,
        description: '',
        count: 0,
        unitQuotation: 0,
        bookingTypeId: 0,
        accountTypeId: 0,
        stockId: 0,
        sourceTax: 0,
        transactionTax: 0,
        tax: 0,
        fee: 0,
        soli: 0,
        marketPlace: ''
    });
    return {
        formData
    };
};
