/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {Ref} from 'vue'
import {reactive, ref} from 'vue'
import type {IAccountFormularData} from '@/types'

const accountFormularData: IAccountFormularData = reactive({
    id: 0,
    swift: '',
    iban: '',
    logoUrl: '',
    withDepot: false
})
const formRef: Ref<HTMLFormElement | null> = ref(null)

export const useAccountFormular = () => {
    return {
        formRef,
        accountFormularData
    }
}
