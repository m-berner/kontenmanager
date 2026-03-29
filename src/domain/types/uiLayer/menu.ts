/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * Handler function for menu or UI actions that take a record ID.
 */
export type ActionHandler = (_recordId: number) => Promise<void>;

/**
 * List of all available menu actions.
 */
export type MenuActionType =
    | "updateBooking"
    | "deleteBooking"
    | "updateStock"
    | "deleteStock"
    | "showDividend"
    | "openLink"
    | "fadeInStock"
    | "addAccount"
    | "updateAccount"
    | "deleteAccount"
    | "addStock"
    | "addBookingType"
    | "deleteBookingType"
    | "updateBookingType"
    | "addBooking"
    | "exportDatabase"
    | "importDatabase"
    | "showAccounting"
    | "updateQuote"
    | "deleteAccountConfirmation"
    | "home"
    | "company"
    | "setting";

/**
 * Configuration for a record's context menu.
 */
export interface MenuConfigData {
    /** Target record identifier. */
    recordId: number;
    /** Available menu items. */
    items: readonly MenuItemData[];
}

/**
 * Descriptor for a single menu item.
 */
export interface MenuItemData {
    /** Unique ID for the item. */
    id: string;
    /** Display title. */
    title: string;
    /** Icon name. */
    icon: string;
    /** Action to execute. */
    action: MenuActionType;
    /** Visual variant (e.g., danger for delete). */
    variant?: "default" | "danger";
}

/**
 * Descriptor for a tab in the options view.
 */
export interface OptionTab {
    /** Tab identifier. */
    id: string;
    /** Display title. */
    title: string;
}

/**
 * Structure of a paragraph in the privacy view.
 */
export interface PrivacyParagraph {
    SUBTITLE: string;
    CONTENT: string;
    ICON: string;
}

/**
 * Router paths for the main views.
 */
export type ViewPathType =
    | "/"
    | "/company"
    | "/help"
    | "/privacy";

/**
 * Available main views in the application.
 */
export type ViewTypeSelectionType =
    | "home"
    | "company"
    | "settings"
    | "help"
    | "privacy";
