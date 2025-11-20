/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {Pinia} from 'pinia'
import {createPinia} from 'pinia'
import {useApp} from '@/composables/useApp'

interface IPinia {
    pinia: Pinia
}

const {log} = useApp()

const piniaConfig: IPinia = {
    pinia: createPinia()
}

export default piniaConfig

log('--- PLUGINS pinia.js ---')
