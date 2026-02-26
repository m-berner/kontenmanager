/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {App, Component, Plugin} from "vue";
import {DomainUtils} from "@/domains/utils";
import FadeInStock from "@/components/dialogs/FadeInStock.vue";
import ShowDividend from "@/components/dialogs/ShowDividend.vue";
import AddStock from "@/components/dialogs/AddStock.vue";
import UpdateStock from "@/components/dialogs/UpdateStock.vue";
import AddAccount from "@/components/dialogs/AddAccount.vue";
import UpdateAccount from "@/components/dialogs/UpdateAccount.vue";
import AddBookingType from "@/components/dialogs/AddBookingType.vue";
import DeleteBookingType from "@/components/dialogs/DeleteBookingType.vue";
import UpdateBookingType from "@/components/dialogs/UpdateBookingType.vue";
import AddBooking from "@/components/dialogs/AddBooking.vue";
import UpdateBooking from "@/components/dialogs/UpdateBooking.vue";
import ExportDatabase from "@/components/dialogs/ExportDatabase.vue";
import ImportDatabase from "@/components/dialogs/ImportDatabase.vue";
import ShowAccounting from "@/components/dialogs/ShowAccounting.vue";
import DeleteAccountConfirmation from "@/components/dialogs/DeleteAccountConfirmation.vue";
import type {MenuActionType} from "@/types";

/**
 * Vue plugin that globally registers dialog components by semantic names.
 *
 * The names correspond to the dialog identifiers used by the teleport/dialog hub.
 */
const ComponentsPlugin: Plugin = {
    /**
     * Installs the plugin into a Vue application instance.
     *
     * @param app - The Vue application to register components with.
     */
    install: (app: App) => {
        /**
         * Helper to register a single dialog component under a typed menu action name.
         *
         * @typeParam K - A union of permitted dialog names.
         * @param name - Registration name used by the dialog hub.
         * @param component - The Vue component to register.
         */
        const registerComponent = <K extends MenuActionType>(
            name: K,
            component: Component
        ) => {
            app.component(name, component);
        };
        registerComponent("fadeInStock", FadeInStock);
        registerComponent("showDividend", ShowDividend);
        registerComponent("addStock", AddStock);
        registerComponent("updateStock", UpdateStock);
        registerComponent("addAccount", AddAccount);
        registerComponent("updateAccount", UpdateAccount);
        registerComponent("addBookingType", AddBookingType);
        registerComponent("deleteBookingType", DeleteBookingType);
        registerComponent("updateBookingType", UpdateBookingType);
        registerComponent("addBooking", AddBooking);
        registerComponent("updateBooking", UpdateBooking);
        registerComponent("exportDatabase", ExportDatabase);
        registerComponent("importDatabase", ImportDatabase);
        registerComponent("showAccounting", ShowAccounting);
        registerComponent("deleteAccountConfirmation", DeleteAccountConfirmation);
    }
};

export default ComponentsPlugin;

DomainUtils.log("PLUGINS components");
