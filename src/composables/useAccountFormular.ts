/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {reactive, ref} from 'vue'
import type {I_Account_DB, I_Account_Formular} from '@/types'

const accountFormularData = reactive<I_Account_Formular>(
    {
        id: -1,
        swift: '',
        iban: '',
        logoUrl: '',
        withDepot: false
    }
)
const formRef = ref<HTMLFormElement | null>(null)

const reset = (): void => {
    Object.assign(accountFormularData, {
        id: -1,
        swift: '',
        iban: '',
        logoUrl: '',
        withDepot: false
    })
    formRef.value = null
}

const mapAccountFormToDb = (id?: number | undefined): I_Account_DB => {
    return {
        cID: id,
        cSwift: accountFormularData.swift.trim().toUpperCase(),
        cIban: accountFormularData.iban.replace(/\s/g, ''),
        cLogoUrl: accountFormularData.logoUrl,
        cWithDepot: accountFormularData.withDepot
    }
}

export function useAccountFormular() {
    return {
        formRef,
        accountFormularData,
        mapAccountFormToDb,
        reset
    }
}
