/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

export const DATE = {
    ISO: "1970-01-01",
    MILLI_PER_DAY: 86400000,
    MILLI_PER_MIN: 60000,
    ISO_DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/,
    ZERO_TIME: 0
} as const;
