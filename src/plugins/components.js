import { useApp } from '@/composables/useApp';
import FadeInStock from '@/components/dialogs/FadeInStock.vue';
import ShowDividend from '@/components/dialogs/ShowDividend.vue';
import AddStock from '@/components/dialogs/AddStock.vue';
import UpdateStock from '@/components/dialogs/UpdateStock.vue';
import AddAccount from '@/components/dialogs/AddAccount.vue';
import UpdateAccount from '@/components/dialogs/UpdateAccount.vue';
import AddBookingType from '@/components/dialogs/AddBookingType.vue';
import DeleteBookingType from '@/components/dialogs/DeleteBookingType.vue';
import UpdateBookingType from '@/components/dialogs/UpdateBookingType.vue';
import AddBooking from '@/components/dialogs/AddBooking.vue';
import UpdateBooking from '@/components/dialogs/UpdateBooking.vue';
import ExportDatabase from '@/components/dialogs/ExportDatabase.vue';
import ImportDatabase from '@/components/dialogs/ImportDatabase.vue';
import ShowAccounting from '@/components/dialogs/ShowAccounting.vue';
import DeleteAccountConfirmation from '@/components/dialogs/DeleteAccountConfirmation.vue';
const { log } = useApp();
const ComponentsPlugin = {
    install: (app) => {
        const registerComponent = (name, component) => {
            app.component(name, component);
        };
        registerComponent('fadeInStock', FadeInStock);
        registerComponent('showDividend', ShowDividend);
        registerComponent('addStock', AddStock);
        registerComponent('updateStock', UpdateStock);
        registerComponent('addAccount', AddAccount);
        registerComponent('updateAccount', UpdateAccount);
        registerComponent('addBookingType', AddBookingType);
        registerComponent('deleteBookingType', DeleteBookingType);
        registerComponent('updateBookingType', UpdateBookingType);
        registerComponent('addBooking', AddBooking);
        registerComponent('updateBooking', UpdateBooking);
        registerComponent('exportDatabase', ExportDatabase);
        registerComponent('importDatabase', ImportDatabase);
        registerComponent('showAccounting', ShowAccounting);
        registerComponent('deleteAccountConfirmation', DeleteAccountConfirmation);
    }
};
export default ComponentsPlugin;
log('--- PLUGINS components.ts ---');
