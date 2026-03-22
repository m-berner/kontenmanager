/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {App, InjectionKey} from "vue";
import {inject} from "vue";

import type {Services} from "@/adapters/secondary/types";

const SERVICES_KEY: InjectionKey<Services> = Symbol("kontenmanager.services");

export function provideServices(app: App, services: Services): void {
    app.provide(SERVICES_KEY, services);
}

export function useServices(): Services {
    const services = inject(SERVICES_KEY, null);
    if (!services) {
        throw new Error(
            "Services are not provided. Call provideServices(app, services) in the entrypoint."
        );
    }
    return services;
}
