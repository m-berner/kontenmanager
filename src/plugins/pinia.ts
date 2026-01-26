/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {createPinia} from 'pinia'
import {UtilsService} from '@/domains/utils'
import type {PiniaWrapper} from '@/types'

const piniaConfig: PiniaWrapper = {
    pinia: createPinia()
}

export default piniaConfig

UtilsService.log('--- plugins/pinia.js ---')
