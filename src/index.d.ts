/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
declare module '*.vue' {
    import type {DefineComponent} from 'vue'
    const component: DefineComponent<
        Record<string, any>, // props
        Record<string, any>, // return from setup()
        any // other component options
    >
    export default component
}
