/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

declare module "*.vue" {
    import type {DefineComponent} from "vue";
    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
    export default component;
}
