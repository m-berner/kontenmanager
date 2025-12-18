/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {App, Plugin} from 'vue'
import {useApp} from '@/composables/useApp'
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

const {log} = useApp()

const ComponentsPlugin: Plugin = {
    install: (app: App) => {
        app.component('fadeInStock', FadeInStock)
        app.component('showDividend', ShowDividend)
        app.component('addStock', AddStock)
        app.component('updateStock', UpdateStock)
        app.component('addAccount', AddAccount)
        app.component('updateAccount', UpdateAccount)
        app.component('addBookingType', AddBookingType)
        app.component('deleteBookingType', DeleteBookingType)
        app.component('updateBookingType', UpdateBookingType)
        app.component('addBooking', AddBooking)
        app.component('updateBooking', UpdateBooking)
        app.component('exportDatabase', ExportDatabase)
        app.component('importDatabase', ImportDatabase)
        app.component('showAccounting', ShowAccounting)
        app.component('deleteAccountConfirmation', DeleteAccountConfirmation)
    }
}

export default ComponentsPlugin

log('--- PLUGINS components.ts ---')
