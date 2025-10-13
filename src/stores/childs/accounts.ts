/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IAccount} from '@/types'
import type {Ref} from 'vue'
import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'

const {log} = useApp()
const {activeAccountId} = useSettings()

export const useAccountsStore = defineStore('accounts', () => {

    const items: Ref<IAccount[]> = ref([])

    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(account => account.cID === id)
    })
    const getById = computed(() => (id: number): IAccount | undefined => {
        return items.value.find(account => account.cID === id)
    })
    const isDuplicate = computed(() => (name: string): boolean => {
        const duplicates = items.value.filter((entry: IAccount) => entry.cIban === name)
        return duplicates.length > 0
    })

    const isDepot = computed((): boolean => {
        const ind = getIndexById.value(activeAccountId.value)
        if (ind > -1) {
            return items.value[ind].cWithDepot
        } else {
            return false
        }
    })

    function add(account: IAccount, prepend: boolean = false): void {
        log('ACCOUNTS_STORE: add')
        if (prepend) {
            items.value.unshift(account)
        } else {
            items.value.push(account)
        }
    }

    function update(account: IAccount): void {
        log('ACCOUNTS_STORE: update')
        const index = getIndexById.value(account.cID)
        if (index !== -1) {
            items.value[index] = {...account}
        }
    }

    function remove(ident: number): void {
        log('ACCOUNTS_STORE: remove', {info: ident})
        const index = getIndexById.value(ident)
        if (index !== -1) {
            items.value.splice(index, 1)
        }
    }

    function clean() {
        items.value.length = 0
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

log('--- STORES accounts.ts ---')
