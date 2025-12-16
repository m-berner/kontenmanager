import {reactive, ref} from 'vue';

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
const mapAccountFormToDb = (id) => {
    return {
        cID: id,
        cSwift: accountFormularData.swift.trim().toUpperCase(),
        cIban: accountFormularData.iban.replace(/\s/g, ''),
        cLogoUrl: accountFormularData.logoUrl,
        cWithDepot: accountFormularData.withDepot
    };
};

export function useAccountFormular() {
    return {
        formRef,
        accountFormularData,
        mapAccountFormToDb,
        reset
    };
}
