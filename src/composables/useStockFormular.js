import { reactive, ref } from 'vue';
import { useApp } from '@/composables/useApp';
const { CONS } = useApp();
const stockFormularData = reactive({
    id: -1,
    isin: '',
    company: '',
    symbol: '',
    meetingDay: '',
    quarterDay: '',
    fadeOut: false,
    firstPage: false,
    url: '',
    askDates: CONS.DATE.DEFAULT_ISO
});
const formRef = ref(null);
const mapStockFormToDb = (aAId) => ({
    cID: stockFormularData.id,
    cISIN: stockFormularData.isin.replace(/\s/g, '').toUpperCase(),
    cCompany: stockFormularData.company,
    cSymbol: stockFormularData.symbol,
    cMeetingDay: stockFormularData.meetingDay,
    cQuarterDay: stockFormularData.quarterDay,
    cFadeOut: stockFormularData.fadeOut ? 1 : 0,
    cFirstPage: stockFormularData.firstPage ? 1 : 0,
    cURL: stockFormularData.url,
    cAccountNumberID: aAId,
    cAskDates: stockFormularData.askDates
});
const reset = () => {
    Object.assign(stockFormularData, {
        id: -1,
        isin: '',
        company: '',
        symbol: '',
        meetingDay: '',
        quarterDay: '',
        fadeOut: false,
        firstPage: false,
        url: '',
        askDates: CONS.DATE.DEFAULT_ISO
    });
    formRef.value = null;
};
export function useStockFormular() {
    return {
        formRef,
        stockFormularData,
        mapStockFormToDb,
        reset
    };
}
