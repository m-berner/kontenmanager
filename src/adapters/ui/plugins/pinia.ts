/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createPinia, type Pinia} from "pinia";

import {log} from "@/domain/utils/utils";

import type {AdaptersInternal} from "@/adapters/driven/types";
import {useAlertsStore} from "@/adapters/ui/stores/alerts";
import {attachStoreDeps} from "@/adapters/ui/stores/deps";

/**
 * Picked from `AdaptersInternal`, not `Adapters`: this is the one place that
 * legitimately needs `configureAlertSink`, which the DI surface deliberately
 * hides from UI code. Bootstrap holds the internal container and passes it
 * here directly, so the wide type never reaches `useAdapters()`.
 */
export type PiniaAdapters = Pick<AdaptersInternal, "storageAdapter" | "alertAdapter">;

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

    // Wire alert rendering to the alert store without making alert service import Pinia/stores.
    adapters.alertAdapter.configureAlertSink(() => useAlertsStore(pinia));

    log("PLUGINS pinia");
    return pinia;
}
