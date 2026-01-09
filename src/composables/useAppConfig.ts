/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {INDEXED_DB} from '@/configurations/indexed_db'
import {DATE} from '@/configurations/date'
import {DEFAULTS} from '@/configurations/defaults'
import {SESSION_STORAGE} from '@/configurations/storage'
import {LOCAL_STORAGE} from '@/configurations/storage'
import {BROWSER_STORAGE} from '@/configurations/storage'
import {PAGES} from '@/configurations/pages'
import {EVENTS} from '@/configurations/events'
import {SERVICES} from '@/configurations/services'
import {SETTINGS} from '@/configurations/settings'
import {STATES} from '@/configurations/states'
import {CURRENCIES} from '@/configurations/currencies'
import {COMPONENTS} from '@/configurations/components'
import {ROUTES} from '@/configurations/routes'
import {SYSTEM} from '@/configurations/system'

export function useAppConfig() {
    return {
        BROWSER_STORAGE,
        COMPONENTS,
        CURRENCIES,
        DATE,
        DEFAULTS,
        EVENTS,
        INDEXED_DB,
        LOCAL_STORAGE,
        PAGES,
        ROUTES,
        SERVICES,
        SESSION_STORAGE,
        SETTINGS,
        STATES,
        SYSTEM
    }
}
