import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { mdiAccountEdit, mdiAccountPlus, mdiAccountRemove, mdiBellPlus, mdiBookEdit, mdiBookPlus, mdiBookRemove, mdiCalculator, mdiCheck, mdiClose, mdiCog, mdiCopyright, mdiCurrencyEur, mdiDatabaseExport, mdiDatabaseImport, mdiDelete, mdiDomain, mdiDomainPlus, mdiDomainRemove, mdiDomainSwitch, mdiDotsVertical, mdiEmail, mdiFileDocumentEdit, mdiFileDocumentMinus, mdiFilterCog, mdiFilterPlus, mdiFilterRemove, mdiFilterSettings, mdiHelpCircle, mdiHome, mdiImage, mdiInfinity, mdiMagnify, mdiPlus, mdiReload, mdiShieldAccount, mdiStoreEdit } from '@mdi/js';
import { useApp } from '@/composables/useApp';
const { log } = useApp();
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
            updateBooking: mdiBookEdit,
            deleteBooking: mdiBookRemove,
            addBookingType: mdiFilterPlus,
            editBookingType: mdiFilterCog,
            deleteBookingType: mdiFilterRemove,
            updateBookingType: mdiFilterSettings,
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
            addCompany: mdiDomainPlus,
            fadeInCompany: mdiDomainSwitch,
            updateCompany: mdiStoreEdit,
            deleteCompany: mdiDomainRemove,
            showCompany: mdiDomain,
            removeDocument: mdiFileDocumentMinus,
            editDocument: mdiFileDocumentEdit,
            help: mdiHelpCircle,
            privacy: mdiShieldAccount,
            mail: mdiEmail,
            magnify: mdiMagnify,
            addAccount: mdiAccountPlus,
            updateAccount: mdiAccountEdit,
            deleteAccount: mdiAccountRemove,
            showDividend: mdiBellPlus
        }
    }
});
const vuetifyConfig = {
    vuetify: vuetifyInstance
};
export default vuetifyConfig;
log('--- PLUGINS vuetify.js ---');
