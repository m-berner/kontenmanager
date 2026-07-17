/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {MenuActionType} from "@/domain/types/uiLayer/menu";

/**
 * State data for an active confirmation dialog.
 */
export interface ConfirmationDialogData {
    /** Unique ID of the confirmation request. */
    id: number;
    /** Title of the dialog. */
    title: string;
    /** Detailed message to display. */
    message: string;
    /** Text for the confirmation button. */
    confirmText: string;
    /** Text for the cancellation button. */
    cancelText: string;
    /** Visual style/severity of the dialog. */
    type: "error" | "success" | "warning" | "info";
    /** Callback to resolve the confirmation. */
    resolve: () => void;
    /** Callback to reject/cancel the confirmation. */
    reject: () => void;
}

/**
 * Permitted dialog action identifiers.
 */
export type DialogActionType =
    | "fadeInStock"
    | "showDividend"
    | "addStock"
    | "updateStock"
    | "addAccount"
    | "updateAccount"
    | "addBookingType"
    | "deleteBookingType"
    | "updateBookingType"
    | "addBooking"
    | "updateBooking"
    | "exportDatabase"
    | "importDatabase"
    | "showAccounting"
    | "deleteAccountConfirmation";

/**
 * Interface for components that can be hosted inside a dialog.
 */
export interface DialogComponent {
    /** Callback triggered when the OK button is clicked. */
    onClickOk: () => Promise<void>;
    /** Header title for the dialog. */
    title: string;
}

/**
 * Names of dialogs that can be opened via the teleport hub.
 */
export type DialogNameType = Extract<
    MenuActionType,
    | "fadeInStock"
    | "showDividend"
    | "addStock"
    | "updateStock"
    | "addAccount"
    | "updateAccount"
    | "addBookingType"
    | "deleteBookingType"
    | "updateBookingType"
    | "addBooking"
    | "updateBooking"
    | "exportDatabase"
    | "importDatabase"
    | "showAccounting"
    | "deleteAccountConfirmation"
>;

export interface TeleportState {
    /** Currently active dialog name. */
    dialogName: DialogNameType | undefined;
    /** Whether the dialog confirms with OK. */
    dialogOk: boolean;
    /** Whether the dialog is visible. */
    dialogVisibility: boolean;
}
