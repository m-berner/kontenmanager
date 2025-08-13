import {} from 'vue';
import { useApp } from '@/apis/useApp';
import AddStock from '@/components/dialogs/AddStock.vue';
import UpdateStock from '@/components/dialogs/UpdateStock.vue';
import AddAccount from '@/components/dialogs/AddAccount.vue';
import UpdateAccount from '@/components/dialogs/UpdateAccount.vue';
import AddBookingType from '@/components/dialogs/AddBookingType.vue';
import DeleteBookingType from '@/components/dialogs/DeleteBookingType.vue';
import AddBooking from '@/components/dialogs/AddBooking.vue';
import UpdateBooking from '@/components/dialogs/UpdateBooking.vue';
import ExportDatabase from '@/components/dialogs/ExportDatabase.vue';
import ImportDatabase from '@/components/dialogs/ImportDatabase.vue';
import ShowAccounting from '@/components/dialogs/ShowAccounting.vue';
const { CONS, log } = useApp();
const ComponentsPlugin = {
    install: (app) => {
        app.component(CONS.COMPONENTS.DIALOGS.ADD_STOCK, AddStock);
        app.component(CONS.COMPONENTS.DIALOGS.UPDATE_STOCK, UpdateStock);
        app.component(CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT, AddAccount);
        app.component(CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT, UpdateAccount);
        app.component(CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE, AddBookingType);
        app.component(CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE, DeleteBookingType);
        app.component(CONS.COMPONENTS.DIALOGS.ADD_BOOKING, AddBooking);
        app.component(CONS.COMPONENTS.DIALOGS.UPDATE_BOOKING, UpdateBooking);
        app.component(CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE, ExportDatabase);
        app.component(CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE, ImportDatabase);
        app.component(CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING, ShowAccounting);
    }
};
export default ComponentsPlugin;
log('--- PLUGINS components.js ---');
