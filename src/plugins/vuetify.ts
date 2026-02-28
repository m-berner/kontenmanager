/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createVuetify} from "vuetify";
import "vuetify/styles";
import {aliases, mdi} from "vuetify/iconsets/mdi-svg";
import {
    mdiAccountEdit,
    mdiAccountPlus,
    mdiAccountRemove,
    mdiAlert,
    mdiAlertCircle,
    mdiBellPlus,
    mdiBookEdit,
    mdiBookPlus,
    mdiBookRemove,
    mdiCalculator,
    mdiCheck,
    mdiCheckCircle,
    mdiClose,
    mdiCog,
    mdiConnection,
    mdiCopyright,
    mdiCurrencyEur,
    mdiDatabaseExport,
    mdiDatabaseImport,
    mdiDelete,
    mdiDomain,
    mdiDomainPlus,
    mdiDomainRemove,
    mdiDomainSwitch,
    mdiDotsVertical,
    mdiEmail,
    mdiFileDocumentEdit,
    mdiFileDocumentMinus,
    mdiFileUpload,
    mdiFilterCog,
    mdiFilterPlus,
    mdiFilterRemove,
    mdiFilterSettings,
    mdiHelpCircle,
    mdiHome,
    mdiImage,
    mdiInfinity,
    mdiInformation,
    mdiMagnify,
    mdiPlus,
    mdiReload,
    mdiShieldAccount,
    mdiStoreEdit
} from "@mdi/js";
import {DomainUtils} from "@/domains/utils";
import type {VuetifyWrapper} from "@/types";

/**
 * Global Vuetify instance with custom themes and icon aliases used across the app.
 */
const vuetifyInstance = createVuetify({
    theme: {
        defaultTheme: "ocean",
        themes: {
            light: {
                dark: false,
                colors: {
                    background: "#e0e0e0",
                    primary: "#eeeeee",
                    surface: "#eeeeee",
                    secondary: "#e0e0e0",
                    warning: "orange",
                    error: "orange",
                    info: "yellow",
                    success: "green"
                }
            },
            dark: {
                dark: true,
                colors: {
                    background: "#121212",
                    primary: "#23222B",
                    surface: "#23222B",
                    secondary: "#e0e0e0",
                    warning: "orange",
                    error: "orange",
                    info: "yellow",
                    success: "green"
                }
            },
            sky: {
                dark: false,
                colors: {
                    background: "#e0e0e0",
                    primary: "#3282f6",
                    surface: "#3282f6",
                    secondary: "#e0e0e0",
                    warning: "orange",
                    error: "orange",
                    info: "yellow",
                    success: "green"
                }
            },
            ocean: {
                dark: false,
                colors: {
                    background: "#e0e0e0",
                    primary: "#194f7d",
                    surface: "#194f7d",
                    secondary: "#e0e0e0",
                    warning: "orange",
                    error: "orange",
                    info: "yellow",
                    success: "green"
                }
            },
            earth: {
                dark: false,
                colors: {
                    background: "#e0e0e0",
                    primary: "#780e12",
                    surface: "#780e12",
                    secondary: "#e0e0e0",
                    warning: "orange",
                    error: "orange",
                    info: "yellow",
                    success: "green"
                }
            },
            meadow: {
                dark: false,
                colors: {
                    background: "#e0e0e0",
                    primary: "#378222",
                    surface: "#378222",
                    secondary: "#e0e0e0",
                    warning: "orange",
                    error: "orange",
                    info: "yellow",
                    success: "green"
                }
            }
        }
    },
    icons: {
        sets: {
            mdi
        },
        defaultSet: "mdi",
        aliases: {
            ...aliases,
            sm: mdiImage,
            home: mdiHome,
            euro: mdiCurrencyEur,
            reload: mdiReload,
            fileUpload: mdiFileUpload,
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
            connection: mdiConnection,
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
            showDividend: mdiBellPlus,
            error: mdiAlertCircle,
            warning: mdiAlert,
            success: mdiCheckCircle,
            info: mdiInformation
        }
    }
});

/**
 * Exported wrapper exposing the configured Vuetify instance for app setup.
 */
const vuetifyConfig: VuetifyWrapper = {
    vuetify: vuetifyInstance
};

export default vuetifyConfig;

DomainUtils.log("PLUGINS vuetify");
