import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { DomainUtils } from "@/domains/utils";
export const useAccountsStore = defineStore("accounts", function () {
    const settings = useSettingsStore();
    const { activeAccountId } = storeToRefs(settings);
    const items = ref([]);
    const getIndexById = computed(() => (id) => {
        return items.value.findIndex((account) => account.cID === id);
    });
    const getById = computed(() => (id) => {
        return items.value.find((account) => account.cID === id);
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
        DomainUtils.log("ACCOUNTS_STORE: add");
        if (prepend) {
            items.value = [account, ...items.value];
        }
        else {
            items.value = [...items.value, account];
        }
    }
    function update(account) {
        DomainUtils.log("ACCOUNTS_STORE: update");
        const index = getIndexById.value(account.cID);
        if (index !== -1) {
            const newItems = [...items.value];
            newItems[index] = { ...account };
            items.value = newItems;
        }
    }
    function remove(ident) {
        DomainUtils.log("ACCOUNTS_STORE: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }
    function clean() {
        DomainUtils.log("ACCOUNTS_STORE: clean");
        items.value = [];
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
DomainUtils.log("--- stores/accounts.ts ---");
