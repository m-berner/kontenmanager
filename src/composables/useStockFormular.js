import { reactive, ref } from 'vue';
import { useApp } from '@/composables/useApp';
const { CONS } = useApp();
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
    url: '',
    askDates: CONS.DATE.DEFAULT_ISO
});
const formRef = ref(null);
export const useStockFormular = () => {
    return {
        formRef,
        stockFormularData
    };
};
