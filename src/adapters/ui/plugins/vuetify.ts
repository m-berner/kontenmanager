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
 *
 * ## `info` is per-theme, and the values are measured
 *
 * `info` was the plain CSS keyword `yellow` (`#FFFF00`) in all six themes. It is
 * the app's most-used severity — every `alertAdapter.feedbackInfo` call, which
 * is the default channel for all non-error feedback — and `AlertOverlay` binds
 * it to a `variant="tonal"` `v-alert`, which draws the *text and border in the
 * colour itself* over a faint tint. On the `light` theme that was **1.08:1**.
 *
 * The values below are not a single blue, because a single value cannot work
 * here: `AlertOverlay`'s `v-card` takes the theme's `surface`, and only `light`
 * has a near-white one. `sky`, `ocean`, `earth` and `meadow` all use a strongly
 * coloured surface (`#3282f6`, `#194f7d`, `#780e12`, `#378222`), so the five
 * non-`dark` themes are not "light themes" as far as contrast is concerned.
 * Each `info` is therefore chosen against *its own* surface — dark blue on the
 * light surface, light blue on the dark ones — and every one clears WCAG AA
 * (4.5:1) for body text:
 *
 * | theme | surface | info | ratio |
 * |-------|---------|------|-------|
 * | light | `#eeeeee` | `#1565C0` | 4.95:1 |
 * | dark | `#23222B` | `#64B5F6` | 7.10:1 |
 * | sky | `#3282f6` | `#031222` | 5.08:1 |
 * | ocean | `#194f7d` | `#90CAF9` | 4.89:1 |
 * | earth | `#780e12` | `#64B5F6` | 5.07:1 |
 * | meadow | `#378222` | `#F5FAFF` | 4.57:1 |
 *
 * `sky` is the outlier and explains the near-black value: `#3282f6` is a
 * mid-tone, and mid-tones are the worst case — nothing in the blue family, in
 * either direction, reaches 4.5:1 against it, and even pure white manages only
 * 3.71:1. If `sky` is ever restyled, re-measure rather than assuming a lighter
 * blue will do.
 *
 * **Known and deliberately out of scope:** `warning`/`error`/`success` have the
 * same problem on the same coloured surfaces, and in places worse than `info`
 * ever was — `error` is 1.08:1 on `sky` and `success` 1.07:1 on `meadow`. That
 * is a palette-wide question (arguably these four themes want lighter surfaces),
 * not something to change quietly alongside an `info` fix.
 *
 * ## `error`/`warning`/`success` were never actually red/orange/green
 *
 * They were the bare CSS keyword strings `"red"`, `"orange"`, `"green"` — which
 * every note above, including the `sky`/`meadow` contrast ratios just quoted,
 * silently assumed rendered as those colours. They didn't: Vuetify's theme
 * colour parser (`util/colorUtils.js`'s `parseColor`) only recognises `#hex`,
 * `rgb()`/`hsl()` and object/number forms. A plain keyword falls through to its
 * hex branch, which runs the string itself through `parseHex` — every
 * non-hex-digit character gets replaced with `F` before parsing. `"red"` (3
 * chars, so first doubled to `"rreedd"`) survives as `"FFeedd"` = `#FFEEDD`, a
 * near-white peach; `"orange"` survives as `#FFAFFE`, a near-white magenta;
 * `"green"` (5 chars, padded rather than doubled) survives as `#FFEEF0`, a
 * near-white mint. `--v-theme-error`/`-warning`/`-success` held these pastel
 * values in every one of the six themes above, not just `ocean`.
 *
 * This was not cosmetic. Every rule-validation message in the app renders via
 * Vuetify's own `.v-input--error .v-messages { color: rgb(var(--v-theme-error)) }`
 * (see `CurrencyInput.vue`/`ValidationMessage.vue`), so a failed rule — e.g.
 * `CreditDebitFieldset`'s "only Soll or Haben, not negative" — never actually
 * showed in red; `MenuItem`'s `base-color="error"` and `AlertOverlay`'s error
 * variant were equally washed out. Fixed by using each colour's hex equivalent
 * (`#FF0000`/`#FFA500`/`#008000`) instead of its keyword — same intended hue,
 * a format `parseColor` actually understands. The `sky`/`meadow` contrast
 * figures above were computed against the *intended* colours and hold for the
 * fixed values; they were never measuring what was actually on screen before.
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
                    warning: "#FFA500",
                    error: "#FF0000",
                    info: "#1565C0",
                    success: "#008000"
                }
            },
            dark: {
                dark: true,
                colors: {
                    background: "#121212",
                    primary: "#23222B",
                    surface: "#23222B",
                    secondary: "#e0e0e0",
                    warning: "#FFA500",
                    error: "#FF0000",
                    info: "#64B5F6",
                    success: "#008000"
                }
            },
            sky: {
                dark: false,
                colors: {
                    background: "#e0e0e0",
                    primary: "#3282f6",
                    surface: "#3282f6",
                    secondary: "#e0e0e0",
                    warning: "#FFA500",
                    error: "#FF0000",
                    info: "#031222",
                    success: "#008000"
                }
            },
            ocean: {
                dark: false,
                colors: {
                    background: "#e0e0e0",
                    primary: "#194f7d",
                    surface: "#194f7d",
                    secondary: "#e0e0e0",
                    warning: "#FFA500",
                    error: "#FF0000",
                    info: "#90CAF9",
                    success: "#008000"
                }
            },
            earth: {
                dark: false,
                colors: {
                    background: "#e0e0e0",
                    primary: "#780e12",
                    surface: "#780e12",
                    secondary: "#e0e0e0",
                    warning: "#FFA500",
                    error: "#FF0000",
                    info: "#64B5F6",
                    success: "#008000"
                }
            },
            meadow: {
                dark: false,
                colors: {
                    background: "#e0e0e0",
                    primary: "#378222",
                    surface: "#378222",
                    secondary: "#e0e0e0",
                    warning: "#FFA500",
                    error: "#FF0000",
                    info: "#F5FAFF",
                    success: "#008000"
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
