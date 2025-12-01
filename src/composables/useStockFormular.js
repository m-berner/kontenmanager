import {reactive, ref} from 'vue';
import {useApp} from '@/composables/useApp';

const {CONS} = useApp();
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

export function useStockFormular() {
    return {
        formRef,
        stockFormularData
    };
}
