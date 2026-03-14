/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createPinia} from "pinia";
import {log} from "@/domains/utils/utils";

/**
 * Export exposing the configured Pinia instance.
 */
export default createPinia();

log("PLUGINS pinia");

