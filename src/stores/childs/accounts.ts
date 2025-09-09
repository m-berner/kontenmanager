/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IAccount} from '@/types'
import type {Ref} from 'vue'
import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useApp} from '@/composables/useApp'

const {log} = useApp()

export const useAccounts = defineStore('accounts', () => {
    // STATE (using ref)
    const items: Ref<IAccount[]> = ref([])

    // GETTERS (using computed)
    const getAccountIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(account => account.cID === id)
    })

    const getAccountById = computed(() => (id: number): IAccount | undefined => {
        return items.value.find(account => account.cID === id)
    })

    // ACTIONS/SETTERS (regular functions)
    function addAccount(account: IAccount, prepend: boolean = false): void {
        log('ACCOUNTS: addAccount')
        if (prepend) {
            items.value.unshift(account)
        } else {
            items.value.push(account)
        }
    }

    // function setAccounts(account: IAccount[]): void {
    //     log('ACCOUNTS: setAccounts')
    //     items.value = [...account]
    // }

    function updateAccount(account: IAccount): void {
        log('ACCOUNTS: updateAccount')
        const index = getAccountIndexById.value(account.cID)
        if (index !== -1) {
            items.value[index] = {...account}
        }
    }

    function deleteAccount(ident: number): void {
        log('ACCOUNTS: deleteAccount', {info: ident})
        const index = getAccountIndexById.value(ident)
        if (index !== -1) {
            items.value.splice(index, 1)
        }
    }

    function clean() {
        items.value.length = 0
    }

    return {
        items,
        getAccountById,
        getAccountIndexById,
        addAccount,
        //setAccounts,
        updateAccount,
        deleteAccount,
        clean
    }
})

log('--- STORE accounts.ts ---')
