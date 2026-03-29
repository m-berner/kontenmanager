/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {App, InjectionKey} from "vue";
import {inject} from "vue";

import type {Adapters} from "@/adapters/secondary/types";

const ADAPTERS_KEY: InjectionKey<Adapters> = Symbol("kontenmanager.adapters");

export function provideAdapters(app: App, adapters: Adapters): void {
    app.provide(ADAPTERS_KEY, adapters);
}

export function useAdapters(): Adapters {
    const adapters = inject(ADAPTERS_KEY, null);
    if (!adapters) {
        throw new Error(
            "Adapters are not provided. Call provideAdapters(app, adapters) in the entrypoint."
        );
    }
    return adapters;
}
