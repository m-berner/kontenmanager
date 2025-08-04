/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {type App, type Plugin} from 'vue'
import {useApp} from '@/apis/useApp'
import AddStock from '@/components/dialogs/AddStock.vue'
import UpdateStock from '@/components/dialogs/UpdateStock.vue'
import AddAccount from '@/components/dialogs/AddAccount.vue'
import UpdateAccount from '@/components/dialogs/UpdateAccount.vue'
import DeleteAccount from '@/components/dialogs/DeleteAccount.vue'
import AddBookingType from '@/components/dialogs/AddBookingType.vue'
import DeleteBookingType from '@/components/dialogs/DeleteBookingType.vue'
import AddBooking from '@/components/dialogs/AddBooking.vue'
import UpdateBooking from '@/components/dialogs/UpdateBooking.vue'
import ExportDatabase from '@/components/dialogs/ExportDatabase.vue'
import ImportDatabase from '@/components/dialogs/ImportDatabase.vue'
import ShowAccounting from '@/components/dialogs/ShowAccounting.vue'

const {CONS, log} = useApp()

const ComponentsPlugin: Plugin = {
  install: (app: App) => {
    app.component(CONS.COMPONENTS.DIALOGS.ADD_STOCK, AddStock)
    app.component(CONS.COMPONENTS.DIALOGS.UPDATE_STOCK, UpdateStock)
    app.component(CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT, AddAccount)
    app.component(CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT, UpdateAccount)
    app.component(CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT, DeleteAccount)
    app.component(CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE, AddBookingType)
    app.component(CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE, DeleteBookingType)
    app.component(CONS.COMPONENTS.DIALOGS.ADD_BOOKING, AddBooking)
    app.component(CONS.COMPONENTS.DIALOGS.UPDATE_BOOKING, UpdateBooking)
    app.component(CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE, ExportDatabase)
    app.component(CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE, ImportDatabase)
    app.component(CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING, ShowAccounting)
  }
}

export default ComponentsPlugin

log('--- PLUGINS components.js ---')
