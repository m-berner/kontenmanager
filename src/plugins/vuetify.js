import {} from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { mdiBookPlus, mdiCalculator, mdiCheck, mdiClose, mdiCog, mdiCopyright, mdiCreditCardEdit, mdiCreditCardPlus, mdiCreditCardRemove, mdiCurrencyEur, mdiDatabaseExport, mdiDatabaseImport, mdiDelete, mdiDotsVertical, mdiEmail, mdiFileDocumentEdit, mdiFileDocumentMinus, mdiFilterCog, mdiFilterPlus, mdiFilterRemove, mdiHelpCircle, mdiHome, mdiImage, mdiImageEdit, mdiImageMinus, mdiImagePlus, mdiInfinity, mdiMagnify, mdiPlus, mdiReload, mdiShieldAccount, mdiTableLargeRemove } from '@mdi/js';
import { useAppApi } from '@/pages/background';
const { log } = useAppApi();
const vuetifyInstance = createVuetify({
    theme: {
        defaultTheme: 'ocean',
        themes: {
            light: {
                dark: false,
                colors: {
                    background: '#e0e0e0',
                    primary: '#eeeeee',
                    surface: '#eeeeee',
                    secondary: '#e0e0e0',
                    warning: 'orange',
                    error: 'orange',
                    info: 'yellow',
                    success: 'green'
                }
            },
            dark: {
                dark: true,
                colors: {
                    background: '#121212',
                    primary: '#23222B',
                    surface: '#23222B',
                    secondary: '#e0e0e0',
                    warning: 'orange',
                    error: 'orange',
                    info: 'yellow',
                    success: 'green'
                }
            },
            sky: {
                dark: false,
                colors: {
                    background: '#e0e0e0',
                    primary: '#3282f6',
                    surface: '#3282f6',
                    secondary: '#e0e0e0',
                    warning: 'orange',
                    error: 'orange',
                    info: 'yellow',
                    success: 'green'
                }
            },
            ocean: {
                dark: false,
                colors: {
                    background: '#e0e0e0',
                    primary: '#194f7d',
                    surface: '#194f7d',
                    secondary: '#e0e0e0',
                    warning: 'orange',
                    error: 'orange',
                    info: 'yellow',
                    success: 'green'
                }
            },
            earth: {
                dark: false,
                colors: {
                    background: '#e0e0e0',
                    primary: '#780e12',
                    surface: '#780e12',
                    secondary: '#e0e0e0',
                    warning: 'orange',
                    error: 'orange',
                    info: 'yellow',
                    success: 'green'
                }
            },
            meadow: {
                dark: false,
                colors: {
                    background: '#e0e0e0',
                    primary: '#378222',
                    surface: '#378222',
                    secondary: '#e0e0e0',
                    warning: 'orange',
                    error: 'orange',
                    info: 'yellow',
                    success: 'green'
                }
            }
        }
    },
    icons: {
        sets: {
            mdi
        },
        defaultSet: 'mdi',
        aliases: {
            ...aliases,
            sm: mdiImage,
            home: mdiHome,
            euro: mdiCurrencyEur,
            reload: mdiReload,
            addBooking: mdiBookPlus,
            addBookingType: mdiFilterPlus,
            editBookingType: mdiFilterCog,
            deleteBookingType: mdiFilterRemove,
            exportToFile: mdiDatabaseExport,
            importDatabase: mdiDatabaseImport,
            showAccounting: mdiCalculator,
            settings: mdiCog,
            copyright: mdiCopyright,
            link: mdiInfinity,
            close: mdiClose,
            add: mdiPlus,
            remove: mdiDelete,
            check: mdiCheck,
            dots: mdiDotsVertical,
            tableRemove: mdiTableLargeRemove,
            removeDocument: mdiFileDocumentMinus,
            editDocument: mdiFileDocumentEdit,
            help: mdiHelpCircle,
            privacy: mdiShieldAccount,
            mail: mdiEmail,
            magnify: mdiMagnify,
            addAccount: mdiCreditCardPlus,
            updateAccount: mdiCreditCardEdit,
            deleteAccount: mdiCreditCardRemove,
            addStock: mdiImagePlus,
            updateStock: mdiImageEdit,
            deleteStock: mdiImageMinus
        }
    }
});
const vuetifyConfig = {
    vuetify: vuetifyInstance
};
export default vuetifyConfig;
log('--- PLUGINS vuetify.js ---');
