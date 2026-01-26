/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {AccountStoreItem} from '@/types'
import {defineStore, storeToRefs} from 'pinia'
import {computed, ref} from 'vue'
import {useSettingsStore} from '@/stores/settings'
import {UtilsService} from '@/domains/utils'

/**
 * Pinia store managing bank account records.
 *
 * @module stores/accounts
 * @returns Reactive account state, computed aggregations,
 * and methods to mutate and enrich account records.
 */
export const useAccountsStore = defineStore('accounts', function () {
    const settings = useSettingsStore()
    const {activeAccountId} = storeToRefs(settings)

    /** All bank account records. */
    const items = ref<AccountStoreItem[]>([])

    /** Finds the index of an account by its ID. */
    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(account => account.cID === id)
    })

    /** Retrieves an account by its ID. */
    const getById = computed(() => (id: number): AccountStoreItem | undefined => {
        return items.value.find(account => account.cID === id)
    })

    /** Checks if an account with the given IBAN already exists. */
    const isDuplicate = computed(() => (name: string): boolean => {
        const duplicates = items.value.filter((entry: AccountStoreItem) => entry.cIban === name)
        return duplicates.length > 0
    })

    /** Whether the currently active account is a depot clearing account. */
    const isDepot = computed((): boolean => {
        const ind = getIndexById.value(activeAccountId.value)
        if (ind > -1) {
            return items.value[ind].cWithDepot
        } else {
            return false
        }
    })

    /**
     * Adds an account to the store.
     *
     * @param account - Account record to add.
     * @param prepend - Whether to insert at the beginning of the list.
     */
    function add(account: AccountStoreItem, prepend: boolean = false): void {
        UtilsService.log('ACCOUNTS_STORE: add')
        if (prepend) {
            items.value = [account, ...items.value]
        } else {
            items.value = [...items.value, account]
        }
    }

    /**
     * Updates an existing account record.
     *
     * @param account - The updated account data.
     */
    function update(account: AccountStoreItem): void {
        UtilsService.log('ACCOUNTS_STORE: update')
        const index = getIndexById.value(account.cID)
        if (index !== -1) {
            const newItems = [...items.value]
            newItems[index] = {...account}
            items.value = newItems
        }
    }

    /**
     * Removes an account from the store by its ID.
     *
     * @param ident - Account ID to remove.
     */
    function remove(ident: number): void {
        UtilsService.log('ACCOUNTS_STORE: remove', ident, 'info')
        items.value = items.value.filter(entry => entry.cID !== ident)
    }

    /**
     * Clears all account records from the store.
     */
    function clean() {
        UtilsService.log('ACCOUNTS_STORE: clean')
        items.value = []
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
    }
})

UtilsService.log('--- stores/accounts.ts ---')
