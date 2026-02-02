/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import { UtilsService } from "@/domains/utils";
import { useAlertStore } from "@/stores/alerts";
import { useBrowser } from "@/composables/useBrowser";
import type { AlertKind, HandleUserInfoOptions, Mode } from "@/types";

/**
 * Composable that centralizes user feedback mechanisms across the app.
 *
 * Supports three delivery modes:
 * - `console`: log via `UtilsService.log` with optional data and log level
 * - `alert`: use the global alert overlay (including confirmation dialogs)
 * - `notice`: native browser notification using the WebExtension API
 *
 * @module composables/useUserInfo
 */
export function useUserInfo() {
  /**
   * Presents a message to the user using the selected mode.
   *
   * @param mode - Delivery mode: `console`, `alert`, or `notice`.
   * @param title - Contextual title or source of the message.
   * @param message - The main message or description.
   * @param options - Extended options for alerts, notices, logging and delays.
   * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
   */
  async function handleUserInfo(
    mode: Mode,
    title: string,
    message: string,
    options: HandleUserInfoOptions = {}
  ): Promise<void | boolean | number> {
    const { data, logLevel = "log", delay = null } = options;

    if (mode === "console") {
      // Log with optional context data and level
      UtilsService.log(`${title}: ${message}`.trim(), data, logLevel);
      return;
    }

    if (mode === "alert") {
      const alerts = useAlertStore();
      const kind: AlertKind =
        options.alertKind ?? (logLevel === "error" ? "error" : "info");

      if (kind === "confirm") {
        return await alerts.confirm(title, message, options.confirm);
      }

      if (kind === "error") {
        return alerts.error(title, message, options.duration ?? null);
      }

      return alerts.info(title, message, options.duration ?? null);
    }

    if (mode === "notice") {
      const { notice } = useBrowser();
      const lines =
        options.noticeLines && options.noticeLines.length > 0
          ? options.noticeLines
          : [title, message].filter(Boolean);

      if (delay && delay > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
      await notice(lines);
      return;
    }

    // Fallback to console if an unknown mode is provided
    UtilsService.log(`${title}: ${message}`.trim(), data ?? null, logLevel);
  }

  return {
    handleUserInfo
  };
}
