/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {reactive, ref} from 'vue'

interface IAccount_Formular {
    id: number
    swift: string
    iban: string
    logoUrl: string
    withDepot: boolean
}

const accountFormularData = reactive<IAccount_Formular>({
    id: 0,
    swift: '',
    iban: '',
    logoUrl: '',
    withDepot: false
})
const formRef = ref<HTMLFormElement | null>(null)

export function useAccountFormular() {
    return {
        formRef,
        accountFormularData
    }
}
