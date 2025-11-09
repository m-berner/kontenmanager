import { reactive, ref } from 'vue';
export function useAccountFormular() {
    const accountFormularData = reactive({
        id: 0,
        swift: '',
        iban: '',
        logoUrl: '',
        withDepot: false
    });
    const formRef = ref(null);
    return {
        formRef,
        accountFormularData
    };
}
