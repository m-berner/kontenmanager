import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
const { log } = useApp();
export const useAccounts = defineStore('accounts', () => {
    const items = ref([]);
    const getIndexById = computed(() => (id) => {
        return items.value.findIndex(account => account.cID === id);
    });
    const getById = computed(() => (id) => {
        return items.value.find(account => account.cID === id);
    });
    function add(account, prepend = false) {
        log('ACCOUNTS: add');
        if (prepend) {
            items.value.unshift(account);
        }
        else {
            items.value.push(account);
        }
    }
    function update(account) {
        log('ACCOUNTS: update');
        const index = getIndexById.value(account.cID);
        if (index !== -1) {
            items.value[index] = { ...account };
        }
    }
    function remove(ident) {
        log('ACCOUNTS: remove', { info: ident });
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
        add,
        update,
        remove,
        clean
    };
});
log('--- STORES accounts.ts ---');
