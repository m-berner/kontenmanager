/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createPinia, type Pinia} from "pinia";

import {log} from "@/domain/utils/utils";

import {useAlertsStore} from "@/adapters/primary/stores/alerts";
import {attachStoreDeps} from "@/adapters/primary/stores/deps";
import type {Adapters} from "@/adapters/secondary/types";

export type PiniaAdapters = Pick<Adapters, "storageAdapter" | "alertAdapter">;

/**
 * Creates a Pinia instance and wires store/service dependencies.
 */
export function createAppPinia(adapters: PiniaAdapters): Pinia {
    const pinia = createPinia();

    // Central place to wire store dependencies for the app runtime.
    attachStoreDeps(pinia, {
        storageAdapter: adapters.storageAdapter,
        alertAdapter: adapters.alertAdapter
    });

    // Wire alert rendering to the alerts store without making alert service import Pinia/stores.
    adapters.alertAdapter.configureAlertSink(() => useAlertsStore(pinia));

    log("PLUGINS pinia");
    return pinia;
}
