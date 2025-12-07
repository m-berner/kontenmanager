import { reactive, ref } from 'vue';
const accountFormularData = reactive({
    id: -1,
    swift: '',
    iban: '',
    logoUrl: '',
    withDepot: false
});
const formRef = ref(null);
const reset = () => {
    Object.assign(accountFormularData, {
        id: -1,
        swift: '',
        iban: '',
        logoUrl: '',
        withDepot: false
    });
    formRef.value = null;
};
export function useAccountFormular() {
    return {
        formRef,
        accountFormularData,
        reset
    };
}
