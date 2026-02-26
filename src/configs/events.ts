/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

export const EVENTS = {
    ABORT: "abort",
    BEFOREUNLOAD: "beforeunload",
    CHANGE: "change",
    CLICK: "click",
    COMPLETE: "complete",
    DOM: "DOMContentLoaded",
    ERROR: "error",
    INPUT: "input",
    KEYDOWN: "keydown",
    LOAD: "load",
    FOCUS: "focus",
    BLUR: "blur",
    SUCCESS: "success",
    UPGRADE: "upgradeneeded"
} as const;
