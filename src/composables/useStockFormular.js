import { reactive, ref } from 'vue';
import { useApp } from '@/composables/useApp';
const { CONS } = useApp();
export function useStockFormular() {
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
    return {
        formRef,
        stockFormularData
    };
}
