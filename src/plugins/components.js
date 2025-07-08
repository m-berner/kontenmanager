/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {} from 'vue';
import { useAppApi } from '@/pages/background';
import AddStock from '@/components/dialogs/AddStock.vue';
import UpdateStock from '@/components/dialogs/UpdateStock.vue';
import DeleteStock from '@/components/dialogs/DeleteStock.vue';
import AddAccount from '@/components/dialogs/AddAccount.vue';
import UpdateAccount from '@/components/dialogs/UpdateAccount.vue';
import DeleteAccount from '@/components/dialogs/DeleteAccount.vue';
import AddBookingType from '@/components/dialogs/AddBookingType.vue';
import DeleteBookingType from '@/components/dialogs/DeleteBookingType.vue';
import AddBooking from '@/components/dialogs/AddBooking.vue';
import ExportDatabase from '@/components/dialogs/ExportDatabase.vue';
import ImportDatabase from '@/components/dialogs/ImportDatabase.vue';
import ShowAccounting from '@/components/dialogs/ShowAccounting.vue';
import DeleteBooking from '@/components/dialogs/DeleteBooking.vue';
const { CONS, log } = useAppApi();
export default {
    install: (app) => {
        app.component(CONS.DIALOGS.ADD_STOCK, AddStock);
        app.component(CONS.DIALOGS.UPDATE_STOCK, UpdateStock);
        app.component(CONS.DIALOGS.DELETE_STOCK, DeleteStock);
        app.component(CONS.DIALOGS.ADD_ACCOUNT, AddAccount);
        app.component(CONS.DIALOGS.UPDATE_ACCOUNT, UpdateAccount);
        app.component(CONS.DIALOGS.DELETE_ACCOUNT, DeleteAccount);
        app.component(CONS.DIALOGS.ADD_BOOKING_TYPE, AddBookingType);
        app.component(CONS.DIALOGS.DELETE_BOOKING_TYPE, DeleteBookingType);
        app.component(CONS.DIALOGS.ADD_BOOKING, AddBooking);
        app.component(CONS.DIALOGS.DELETE_BOOKING, DeleteBooking);
        app.component(CONS.DIALOGS.EXPORT_DATABASE, ExportDatabase);
        app.component(CONS.DIALOGS.IMPORT_DATABASE, ImportDatabase);
        app.component(CONS.DIALOGS.SHOW_ACCOUNTING, ShowAccounting);
    }
};
log('--- PLUGINS components.js ---');
