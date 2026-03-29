/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {App, Component, Plugin} from "vue";

import type {DialogNameType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import AddAccount from "@/adapters/primary/components/dialogs/AddAccount.vue";
import AddBooking from "@/adapters/primary/components/dialogs/AddBooking.vue";
import AddBookingType from "@/adapters/primary/components/dialogs/AddBookingType.vue";
import AddStock from "@/adapters/primary/components/dialogs/AddStock.vue";
import DeleteAccountConfirmation from "@/adapters/primary/components/dialogs/DeleteAccountConfirmation.vue";
import DeleteBookingType from "@/adapters/primary/components/dialogs/DeleteBookingType.vue";
import ExportDatabase from "@/adapters/primary/components/dialogs/ExportDatabase.vue";
import FadeInStock from "@/adapters/primary/components/dialogs/FadeInStock.vue";
import ImportDatabase from "@/adapters/primary/components/dialogs/ImportDatabase.vue";
import ShowAccounting from "@/adapters/primary/components/dialogs/ShowAccounting.vue";
import ShowDividend from "@/adapters/primary/components/dialogs/ShowDividend.vue";
import UpdateAccount from "@/adapters/primary/components/dialogs/UpdateAccount.vue";
import UpdateBooking from "@/adapters/primary/components/dialogs/UpdateBooking.vue";
import UpdateBookingType from "@/adapters/primary/components/dialogs/UpdateBookingType.vue";
import UpdateStock from "@/adapters/primary/components/dialogs/UpdateStock.vue";

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
        const registerComponent = <K extends DialogNameType>(
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

log("PLUGINS components");

