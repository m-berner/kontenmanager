/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * Kind of alert to display to the user.
 */
export type AlertKindType = "info" | "error" | "confirm";

/**
 * Mode of the alert (transient notice vs. persistent alert).
 */
export type AlertModeType = "notice" | "alert";

/**
 * Interface for the alert notification store.
 */
export type AlertStoreContract = {
    /** Triggers an information alert. */
    info: (_title: string, _message: string, _duration: number | null) => void;
};

/**
 * State of a currently visible alert/notification.
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
