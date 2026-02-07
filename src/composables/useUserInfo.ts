/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import { DomainUtils } from "@/domains/utils";
import { useAlertStore } from "@/stores/alerts";
import { DEFAULTS } from "@/config/defaults";
import type {
  AlertKind,
  HandleUserInfoOptions,
  Mode,
  UserInfoAlertConfirmResult,
  UserInfoAlertErrorResult,
  UserInfoAlertInfoResult
} from "@/types";

/**
 * Composable that centralizes user feedback mechanisms across the app.
 *
 * Supports two delivery modes:
 * - `alert`: use the global alert overlay (including confirmation dialogs)
 * - `notice`: native browser notification using the WebExtension API
 *
 * @module composables/useUserInfo
 */
// Simple in-memory rate-limit tracker
const recentMessages = new Map<string, number>();

export function useUserInfo() {
  /**
   * Presents a message to the user using the selected mode.
   *
   * @param _mode - Delivery mode: `alert`, or `notice`.
   * @param _title - Contextual title or source of the message.
   * @param _error - The Error object.
   * @param _options - Extended options for alerts, notices, logging, and delays.
   * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
   */
  async function handleUserInfo(
    _mode: "alert",
    _title: string,
    _error: Error | unknown,
    _options?: HandleUserInfoOptions & { alertKind?: "confirm" }
  ): Promise<UserInfoAlertConfirmResult>;

  async function handleUserInfo(
    _mode: "alert",
    _title: string,
    _error: Error | unknown,
    _options?: HandleUserInfoOptions & {
      alertKind?: "error";
      duration?: number | null;
    }
  ): Promise<UserInfoAlertErrorResult>;

  async function handleUserInfo(
    _mode: "alert",
    _title: string,
    _error: Error | unknown,
    _options?: HandleUserInfoOptions & {
      alertKind?: "info";
      duration?: number | null;
    }
  ): Promise<UserInfoAlertInfoResult>;

  async function handleUserInfo(
    _mode: Mode,
    _title: string,
    _error: Error | unknown,
    _options: HandleUserInfoOptions = {}
  ): Promise<void | boolean | number> {
    const { data, logLevel = "log", correlationId } = _options;
    let message: string = "";
    let errorStack: string | undefined;
    // Normalize error input
    if (_error instanceof Error) {
      message = _error.message;
      errorStack = _error.stack;
    } else {
      message = "Missing error";
    }

    // Rate limit identical messages per mode/kind/title/message
    const rateLimitMs = _options.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
    const effectiveKind: AlertKind =
      _options.alertKind ?? (logLevel === "error" ? "error" : "info");
    const key = `${_mode}|${effectiveKind}|${_title}|${message}`;
    const now = Date.now();
    const last = recentMessages.get(key) ?? 0;
    if (rateLimitMs > 0 && now - last < rateLimitMs) {
      // Suppressed duplicate
      return;
    }
    recentMessages.set(key, now);

    if (_mode === "alert") {
      let alerts: ReturnType<typeof useAlertStore> | null = null;
      try {
        alerts = useAlertStore();
      } catch {
        // Fallback to console if store not available
        DomainUtils.log(
          `ALERT_FALLBACK ${_title}: ${message}`.trim(),
          {
            ...((data as Record<string, unknown>) || {}),
            correlationId,
            errorStack
          },
          logLevel
        );
        return;
      }
      const kind: AlertKind = effectiveKind;

      if (kind === "confirm") {
        return await alerts.confirm(_title, message, _options.confirm);
      }

      if (kind === "error") {
        const duration =
          _options.duration ?? DEFAULTS.USER_INFO.DURATION.ERROR ?? null;
        return alerts.error(_title, message, duration);
      }

      const duration = _options.duration ?? DEFAULTS.USER_INFO.DURATION.INFO;
      return alerts.info(_title, message, duration);
    }

    // Fallback to console if an unknown mode is provided
    DomainUtils.log(`${_title}: ${message}`.trim(), data ?? null, logLevel);
  }

  return {
    handleUserInfo
  };
}
