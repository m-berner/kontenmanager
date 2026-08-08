/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import "vuetify/styles";
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
    mdiLanConnect,
    mdiLanDisconnect,
    mdiLanPending,
    mdiMagnify,
    mdiPlus,
    mdiReload,
    mdiShieldAccount,
    mdiStoreEdit
} from "@mdi/js";
import {createVuetify} from "vuetify";
import {aliases, mdi} from "vuetify/iconsets/mdi-svg";

import {log} from "@/domain/utils/utils";

/**
 * Exposing the configured Vuetify instance with custom themes and icon aliases for app setup.
 *
 * All six themes share one status palette, and `error` is **red** while
 * `warning` stays orange. They were the same value — orange — in all six, with
 * no comment explaining it and against Vuetify's own default.
 *
 * That was more than a palette preference, because the app maintains a
 * four-value severity distinction through several deliberate layers:
 * `VisualAlertType` in `stores/alerts.ts`, the `info`/`warning`/`error` split in
 * `alertAdapter`'s `ALERT_INFO.DURATIONS` (errors alone get `duration: null`,
 * i.e. no auto-dismiss), and `AlertOverlay`'s `:type` binding. Two of those four
 * rendered identically, so the distinction the rest of the code works to
 * maintain was not observable to the user:
 *
 * - A validation warning from `submitGuard` looked exactly like a genuine
 *   `feedbackError` from a failed database write.
 * - `MenuItem`'s `base-color="error"` on a delete row rendered **orange**, so
 *   the destructive action was styled the same as a caution.
 * - Meanwhile `winLossClass` uses a hand-rolled `color-red` CSS class for a
 *   negative balance, so the one thing that *was* red was a number, not an
 *   error.
 *
 * Note the icon aliases were always distinct — `$error`, `$warning`, `$success`
 * and `$info` are all defined below, so `AlertOverlay`'s dynamic `` `$${type}` ``
 * lookup resolves for all four. Only the colours collided.
 */
export const vuetify = createVuetify({
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
                    error: "red",
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
                    error: "red",
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
                    error: "red",
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
                    error: "red",
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
                    error: "red",
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
                    error: "red",
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
            // Three distinct glyphs for TitleBar's connectivity indicator, so
            // "still probing" is not mistaken for "no connection" — the pending
            // state used to render the same icon as the failed one, which made a
            // slow probe indistinguishable from an offline result.
            connectionChecking: mdiLanPending,
            connectionOnline: mdiLanConnect,
            connectionOffline: mdiLanDisconnect,
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

export default vuetify;

log("PLUGINS vuetify");
