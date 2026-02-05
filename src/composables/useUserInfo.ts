/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import { DomainUtils } from "@/domains/utils";
import { useAlertStore } from "@/stores/alerts";
import { useBrowser } from "@/composables/useBrowser";
import { DEFAULTS } from "@/config/defaults";
import type {
  AlertKind,
  HandleUserInfoOptions,
  Mode,
  UserInfoAlertConfirmResult,
  UserInfoAlertErrorResult,
  UserInfoAlertInfoResult,
  UserInfoConsoleResult,
  UserInfoNoticeResult
} from "@/types";

/**
 * Composable that centralizes user feedback mechanisms across the app.
 *
 * Supports three delivery modes:
 * - `console`: log via `DomainUtils.log` with optional data and log level
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
   * @param _mode - Delivery mode: `console`, `alert`, or `notice`.
   * @param _title - Contextual title or source of the message.
   * @param _messageOrError - The main message or an Error object.
   * @param _options - Extended options for alerts, notices, logging, and delays.
   * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
   */
  // Overloads for stronger typing at call-sites
  async function handleUserInfo(
    _mode: "console",
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserInfoOptions
  ): Promise<UserInfoConsoleResult>;
  async function handleUserInfo(
    _mode: "notice",
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserInfoOptions
  ): Promise<UserInfoNoticeResult>;
  async function handleUserInfo(
    _mode: "alert",
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserInfoOptions & {
      alertKind?: "info";
      duration?: number | null;
    }
  ): Promise<UserInfoAlertInfoResult>;
  async function handleUserInfo(
    _mode: "alert",
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserInfoOptions & {
      alertKind?: "error";
      duration?: number | null;
    }
  ): Promise<UserInfoAlertErrorResult>;
  async function handleUserInfo(
    _mode: "alert",
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserInfoOptions & { alertKind: "confirm" }
  ): Promise<UserInfoAlertConfirmResult>;
  async function handleUserInfo(
    mode: Mode,
    title: string,
    messageOrError: string | Error,
    options: HandleUserInfoOptions = {}
  ): Promise<void | boolean | number> {
    const { data, logLevel = "log", delay = null, correlationId } = options;

    // Normalize error input
    let message = "";
    let errorStack: string | undefined;
    if (messageOrError instanceof Error) {
      message = messageOrError.message || String(messageOrError);
      errorStack = messageOrError.stack;
    } else {
      message = messageOrError;
    }

    // Rate limit identical messages per mode/kind/title/message
    const rateLimitMs = options.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
    const effectiveKind: AlertKind =
      options.alertKind ?? (logLevel === "error" ? "error" : "info");
    const key = `${mode}|${effectiveKind}|${title}|${message}`;
    const now = Date.now();
    const last = recentMessages.get(key) ?? 0;
    if (rateLimitMs > 0 && now - last < rateLimitMs) {
      // Suppressed duplicate
      return;
    }
    recentMessages.set(key, now);

    if (mode === "console") {
      // Log with optional context data and level
      DomainUtils.log(
        `${title}: ${message}`.trim(),
        {
          ...((data as Record<string, unknown>) || {}),
          correlationId,
          errorStack
        },
        logLevel
      );
      return;
    }

    if (mode === "alert") {
      let alerts: ReturnType<typeof useAlertStore> | null = null;
      try {
        alerts = useAlertStore();
      } catch {
        // Fallback to console if store not available
        DomainUtils.log(
          `ALERT_FALLBACK ${title}: ${message}`.trim(),
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
        return await alerts.confirm(title, message, options.confirm);
      }

      if (kind === "error") {
        const duration =
          options.duration ?? DEFAULTS.USER_INFO.DURATION.ERROR ?? null;
        return alerts.error(title, message, duration);
      }

      const duration = options.duration ?? DEFAULTS.USER_INFO.DURATION.INFO;
      return alerts.info(title, message, duration);
    }

    if (mode === "notice") {
      let notice: ((_lines: string[]) => Promise<void>) | null = null;
      try {
        ({ notice } = useBrowser());
      } catch {
        // Fallback to console if browser wrapper unavailable
        DomainUtils.log(
          `NOTICE_FALLBACK ${title}: ${message}`.trim(),
          {
            ...((data as Record<string, unknown>) || {}),
            correlationId,
            errorStack
          },
          logLevel
        );
        return;
      }
      const lines =
        options.noticeLines && options.noticeLines.length > 0
          ? options.noticeLines
          : [title, message].filter(Boolean);

      if (delay && delay > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
      if (notice) {
        await notice(lines);
      }
      return;
    }

    // Fallback to console if an unknown mode is provided
    DomainUtils.log(`${title}: ${message}`.trim(), data ?? null, logLevel);
  }

  return {
    handleUserInfo
  };
}
