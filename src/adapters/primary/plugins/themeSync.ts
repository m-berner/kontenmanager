/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {Pinia} from "pinia";
import {effectScope, watch} from "vue";
import type {createVuetify} from "vuetify";

import {log} from "@/domain/utils/utils";

import {useSettingsStore} from "@/adapters/primary/stores/settings";

type VuetifyInstance = ReturnType<typeof createVuetify>;

/**
 * Syncs Vuetify global theme with the persisted `settings.skin` value.
 *
 * Runs outside component setup using an effect scope so it can be started from
 * entrypoints without needing a root component hook.
 */
export function startThemeSync(pinia: Pinia, vuetify: VuetifyInstance): () => void {
    const scope = effectScope(true);

    scope.run(() => {
        const settings = useSettingsStore(pinia);

        watch(
            () => settings.skin,
            (next) => {
                if (vuetify?.theme?.global?.name) {
                    vuetify.theme.global.name.value = next;
                }
            },
            {immediate: true}
        );
    });

    log("PLUGINS themeSync");
    return () => scope.stop();
}
