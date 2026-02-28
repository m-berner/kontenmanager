/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AccountStoreItem} from "@/types";
import {defineStore, storeToRefs} from "pinia";
import {computed, ref} from "vue";
import {useSettingsStore} from "@/stores/settings";
import {DomainUtils} from "@/domains/utils";

export const useAccountsStore = defineStore("accounts", function () {
    const settings = useSettingsStore();
    const {activeAccountId} = storeToRefs(settings);
    /** All bank account records. */
    const items = ref<AccountStoreItem[]>([]);

    function insertItem(item: AccountStoreItem, prepend: boolean): void {
        items.value = prepend ? [item, ...items.value] : [...items.value, item];
    }

    function replaceItemById(id: number, next: AccountStoreItem): void {
        const index = getIndexById.value(id);
        if (index === -1) {
            return;
        }
        const newItems = [...items.value];
        newItems[index] = next;
        items.value = newItems;
    }

    /** Finds the index of an account by its ID. */
    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex((account) => account.cID === id);
    });

    /** Retrieves an account by its ID. */
    const getById = computed(() => (id: number): AccountStoreItem | undefined => {
        return items.value.find((account) => account.cID === id);
    });

    /** Checks if an account with the given IBAN already exists. */
    const isDuplicate = computed(() => (name: string): boolean => {
        return items.value.some((entry: AccountStoreItem) => entry.cIban === name);
    });

    /** Whether the currently active account is a depot clearing account. */
    const isDepot = computed((): boolean => {
        const ind = getIndexById.value(activeAccountId.value);
        if (ind > -1) {
            return items.value[ind].cWithDepot;
        } else {
            return false;
        }
    });

    /**
     * Adds an account to the store.
     *
     * @param account - Account record to add.
     * @param prepend - Whether to insert at the beginning of the list.
     */
    function add(account: AccountStoreItem, prepend: boolean = false): void {
        DomainUtils.log("STORES accounts: add");
        insertItem(account, prepend);
    }

    /**
     * Updates an existing account record.
     *
     * @param account - The updated account data.
     */
    function update(account: AccountStoreItem): void {
        DomainUtils.log("STORES accounts: update");
        replaceItemById(account.cID, {...account});
    }

    /**
     * Removes an account from the store by its ID.
     *
     * @param ident - Account ID to remove.
     */
    function remove(ident: number): void {
        DomainUtils.log("STORES accounts: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }

    /**
     * Clears all account records from the store.
     */
    function clean() {
        DomainUtils.log("STORES accounts: clean");
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

DomainUtils.log("STORES accounts");
