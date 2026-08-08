/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * State of a currently visible alert/notification.
 *
 * `type` inlines the four kinds the UI actually renders — the same four
 * `AlertOverlay` looks up an icon alias for (`$error`/`$warning`/`$success`/
 * `$info`) and the same four `alertAdapter.ALERT_INFO.DURATIONS` is keyed on.
 * A separate `AlertKindType` (`"info" | "error" | "confirm"`) used to sit above
 * this declaration with no consumer and a different vocabulary in both
 * directions — `confirm` only there, `success`/`warning` only here — so anyone
 * typing a new alert helper against it would have produced values this struct
 * cannot hold. It was removed rather than reconciled, together with
 * `AlertModeType` and `AlertStoreContract`, neither of which had a consumer or
 * a counterpart in the alerts store.
 */
export interface VisibleAlertData {
    /** Alert identifier. */
    id: number;
    /** Type/Severity of the alert. */
    type: "error" | "success" | "warning" | "info" | undefined;
    /** Title of the alert. */
    title: string;
    /** Detailed message. */
    message: string;
}
