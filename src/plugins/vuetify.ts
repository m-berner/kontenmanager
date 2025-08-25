/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {type Plugin} from 'vue'
import {createVuetify} from 'vuetify'
import 'vuetify/styles'
import {aliases, mdi} from 'vuetify/iconsets/mdi-svg'
import {
    mdiAccountEdit,
    mdiAccountPlus,
    mdiAccountRemove,
    mdiBellPlus,
    mdiBookEdit,
    mdiBookPlus,
    mdiBookRemove,
    mdiCalculator,
    mdiCheck,
    mdiClose,
    mdiCog,
    mdiCopyright,
    mdiCurrencyEur,
    mdiDatabaseExport,
    mdiDatabaseImport,
    mdiDelete,
    mdiDotsVertical,
    mdiEmail,
    mdiFileDocumentEdit,
    mdiFileDocumentMinus,
    mdiFilterCog,
    mdiFilterPlus,
    mdiFilterRemove,
    mdiHelpCircle,
    mdiHome,
    mdiImage,
    mdiInfinity,
    mdiMagnify,
    mdiPlus,
    mdiReload,
    mdiShieldAccount,
    mdiStore,
    mdiStoreEdit,
    mdiStoreMinus,
    mdiStorePlus
} from '@mdi/js'
import {useApp} from '@/composables/useApp'

interface IVuetify {
    vuetify: Plugin
}

const {log} = useApp()

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
                    background: '#121212', // Fixed: should be dark for dark theme
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
                    surface: '#378222', // Fixed: was '#378D22' (inconsistent)
                    secondary: '#e0e0e0',
                    // Note: 'topbar' is not a standard Vuetify color token
                    // Consider using a CSS custom property or component-specific styling
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
            addCompany: mdiStorePlus,
            updateCompany: mdiStoreEdit,
            deleteCompany: mdiStoreMinus,
            showCompany: mdiStore,
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
})

const vuetifyConfig: IVuetify = {
    vuetify: vuetifyInstance
}

export default vuetifyConfig

log('--- PLUGINS vuetify.js ---')