/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

export const DEFAULTS = Object.freeze({
  CURRENCY: "EUR",
  LANG: "de",
  LOCALE: "de-DE",
  ASK_DATE_INTERVAL: 7, // days
  SM_RESTORE_ACCOUNT_ID: 1,
  LARGE_FILE_THRESHOLD_KB: 10000,
  TITLE: "KontenManager",
  COPYRIGHT: `2025-${new Date().getFullYear()} Martin Berner`,
  MAILTO: "mailto:kontenmanager@gmx.de",
  HELP_URL: "https://kontenmanager8.wixsite.com/kontenmanager",
  // Defaults for user information/feedback handling
  USER_INFO: Object.freeze({
    RATE_LIMIT_MS: 1500,
    DURATION: Object.freeze({
      INFO: 4000,
      ERROR: null as number | null
    })
  })
});
