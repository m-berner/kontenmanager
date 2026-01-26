/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {App, Component, Plugin} from 'vue'
import {UtilsService} from '@/domains/utils'
import FadeInStock from '@/components/dialogs/FadeInStock.vue'
import ShowDividend from '@/components/dialogs/ShowDividend.vue'
import AddStock from '@/components/dialogs/AddStock.vue'
import UpdateStock from '@/components/dialogs/UpdateStock.vue'
import AddAccount from '@/components/dialogs/AddAccount.vue'
import UpdateAccount from '@/components/dialogs/UpdateAccount.vue'
import AddBookingType from '@/components/dialogs/AddBookingType.vue'
import DeleteBookingType from '@/components/dialogs/DeleteBookingType.vue'
import UpdateBookingType from '@/components/dialogs/UpdateBookingType.vue'
import AddBooking from '@/components/dialogs/AddBooking.vue'
import UpdateBooking from '@/components/dialogs/UpdateBooking.vue'
import ExportDatabase from '@/components/dialogs/ExportDatabase.vue'
import ImportDatabase from '@/components/dialogs/ImportDatabase.vue'
import ShowAccounting from '@/components/dialogs/ShowAccounting.vue'
import DeleteAccountConfirmation from '@/components/dialogs/DeleteAccountConfirmation.vue'
import type {MenuActionType} from '@/types'

const ComponentsPlugin: Plugin = {
    install: (app: App) => {
        const registerComponent = <K extends MenuActionType>(
            name: K,
            component: Component
        ) => {
            app.component(name, component)
        }
        registerComponent('fadeInStock', FadeInStock)
        registerComponent('showDividend', ShowDividend)
        registerComponent('addStock', AddStock)
        registerComponent('updateStock', UpdateStock)
        registerComponent('addAccount', AddAccount)
        registerComponent('updateAccount', UpdateAccount)
        registerComponent('addBookingType', AddBookingType)
        registerComponent('deleteBookingType', DeleteBookingType)
        registerComponent('updateBookingType', UpdateBookingType)
        registerComponent('addBooking', AddBooking)
        registerComponent('updateBooking', UpdateBooking)
        registerComponent('exportDatabase', ExportDatabase)
        registerComponent('importDatabase', ImportDatabase)
        registerComponent('showAccounting', ShowAccounting)
        registerComponent('deleteAccountConfirmation', DeleteAccountConfirmation)
    }
}

export default ComponentsPlugin

UtilsService.log('--- plugins/components.ts ---')
