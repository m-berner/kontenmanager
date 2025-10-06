import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
import { useSettings } from '@/composables/useSettings';
const { log } = useApp();
const { activeAccountId } = useSettings();
export const useAccountsStore = defineStore('accounts', () => {
    const items = ref([]);
    const getIndexById = computed(() => (id) => {
        return items.value.findIndex(account => account.cID === id);
    });
    const getById = computed(() => (id) => {
        return items.value.find(account => account.cID === id);
    });
    const isDuplicate = computed(() => (name) => {
        const duplicates = items.value.filter((entry) => entry.cIban === name);
        return duplicates.length > 0;
    });
    const isDepot = computed(() => {
        const ind = getIndexById.value(activeAccountId.value);
        if (ind > -1) {
            return items.value[ind].cWithDepot;
        }
        else {
            return false;
        }
    });
    function add(account, prepend = false) {
        log('ACCOUNTS_STORE: add');
        if (prepend) {
            items.value.unshift(account);
        }
        else {
            items.value.push(account);
        }
    }
    function update(account) {
        log('ACCOUNTS_STORE: update');
        const index = getIndexById.value(account.cID);
        if (index !== -1) {
            items.value[index] = { ...account };
        }
    }
    function remove(ident) {
        log('ACCOUNTS_STORE: remove', { info: ident });
        const index = getIndexById.value(ident);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }
    function clean() {
        items.value.length = 0;
    }
    return {
        items,
        getById,
        getIndexById,
        isDuplicate,
        isDepot,
        add,
        update,
        remove,
        clean
    };
});
log('--- STORES accounts.ts ---');
