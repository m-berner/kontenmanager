import { reactive, ref } from 'vue';
const stockFormularData = reactive({
    id: -1,
    isin: '',
    company: '',
    wkn: '',
    symbol: '',
    meetingDay: '',
    quarterDay: '',
    fadeOut: false,
    firstPage: false,
    url: ''
});
const formRef = ref(null);
export const useStockFormular = () => {
    return {
        formRef,
        stockFormularData
    };
};
