import { reactive, ref } from 'vue';
const accountFormularData = reactive({
    id: 0,
    swift: '',
    iban: '',
    logoUrl: '',
    withDepot: false
});
const formRef = ref(null);
export function useAccountFormular() {
    return {
        formRef,
        accountFormularData
    };
}
