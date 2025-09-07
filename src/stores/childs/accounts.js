import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useNotification } from '@/composables/useNotification';
const { log } = useNotification();
export const useAccounts = defineStore('accounts', () => {
    const items = ref([]);
    const getAccountIndexById = computed(() => (id) => {
        return items.value.findIndex(account => account.cID === id);
    });
    const getAccountById = computed(() => (id) => {
        return items.value.find(account => account.cID === id);
    });
    function addAccount(account, prepend = false) {
        log('ACCOUNTS: addAccount');
        if (prepend) {
            items.value.unshift(account);
        }
        else {
            items.value.push(account);
        }
    }
    function setAccounts(account) {
        log('ACCOUNTS: setAccounts');
        items.value = [...account];
    }
    function updateAccount(account) {
        log('ACCOUNTS: updateAccount');
        const index = getAccountIndexById.value(account.cID);
        if (index !== -1) {
            items.value[index] = { ...account };
        }
    }
    function deleteAccount(ident) {
        log('ACCOUNTS: deleteAccount', { info: ident });
        const index = getAccountIndexById.value(ident);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }
    function clean() {
        items.value.length = 0;
    }
    return {
        items,
        getAccountById,
        getAccountIndexById,
        addAccount,
        setAccounts,
        updateAccount,
        deleteAccount,
        clean
    };
});
log('--- STORE accounts.ts ---');
