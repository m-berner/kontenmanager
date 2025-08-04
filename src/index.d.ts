/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

// NOTE: This project uses vue3 option components only.
declare module '*.vue' {
  import {type ComponentOptions} from 'vue'
  const component: ComponentOptions
  // noinspection JSUnusedGlobalSymbols
  export default component
}
