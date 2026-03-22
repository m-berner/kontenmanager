/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed, ref} from "vue";

import type {AccountStoreItem} from "@/domain/types";
import {log} from "@/domain/utils/utils";
import {isDuplicateAccountIban} from "@/domain/validation/duplicates";

/**
 * A Pinia store for managing bank account records.
 *
 * This store allows for performing CRUD operations on account records, checking for duplicates,
 * determining specific account properties, and more.
 */
export const useAccountsStore = defineStore("accounts", function () {
    /** All bank account records. */
    const items = ref<AccountStoreItem[]>([]);

    /**
     * Inserts an item into the list of stored items.
     *
     * @param item - The item to be inserted into the list.
     * @param prepend - A flag indicating whether the item should be added to the beginning (true) or the end (false) of the list.
     */
    function insertItem(item: AccountStoreItem, prepend: boolean): void {
        items.value = prepend ? [item, ...items.value] : [...items.value, item];
    }

    /**
     * Replaces an item in the list identified by its unique identifier.
     *
     * @param id - The unique identifier of the item to be replaced.
     * @param next - The new item to replace the existing item.
     */
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
        return isDuplicateAccountIban(items.value, name);
    });

    /** Whether the given account is a depot clearing account. */
    const isDepotById = computed(() => (accountId: number): boolean => {
        const ind = getIndexById.value(accountId);
        return ind > -1 ? items.value[ind].cWithDepot : false;
    });

    /**
     * Adds an account to the store.
     *
     * @param account - Account record to add.
     * @param prepend - Whether to insert at the beginning of the list.
     */
    function add(account: AccountStoreItem, prepend: boolean = false): void {
        log("STORES accounts: add");
        insertItem(account, prepend);
    }

    /**
     * Updates an existing account record.
     *
     * @param account - The updated account data.
     */
    function update(account: AccountStoreItem): void {
        log("STORES accounts: update");
        replaceItemById(account.cID, {...account});
    }

    /**
     * Removes an account from the store by its ID.
     *
     * @param ident - Account ID to remove.
     */
    function remove(ident: number): void {
        log("STORES accounts: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }

    /**
     * Clears all account records from the store.
     */
    function clean() {
        log("STORES accounts: clean");
        items.value = [];
    }

    return {
        items,
        getById,
        getIndexById,
        isDuplicate,
        isDepotById,
        add,
        update,
        remove,
        clean
    };
});

log("STORES accounts");
