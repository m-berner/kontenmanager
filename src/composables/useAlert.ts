/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import { useAlertStore } from "@/stores/alerts";
import { DEFAULTS } from "@/config/defaults";
import type { HandleUserAlertOptions } from "@/types";
import { DomainUtils } from "@/domains/utils";

/**
 * Message times queue.
 */
const recentMessages = new Map<string, number>();

/**
 * Composable that centralizes user feedback mechanisms across the app.
 * Uses the global alert overlay (including confirmation dialogs)
 *
 * @module composables/useAlert
 */
export function useAlert() {
  /**
   * Presents a message to the user using to inform.
   *
   * @param _title - Contextual title or source of the message.
   * @param _error - The Error object.
   * @param _options - Extended options for alerts, notices, logging, and delays.
   * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
   */
  async function handleUserInfo(
    _title: string,
    _error: Error | unknown,
    _options?: HandleUserAlertOptions
  ): Promise<number | void> {
    let message: string = "";
    // Normalize error input
    if (_error instanceof Error) {
      message = _error.message;
    } else {
      message = "Missing error";
    }

    // Rate limit identical messages per kind/title/message
    const rateLimitMs =
      _options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
    const key = `info|${_title}|${message}`;
    const now = Date.now();
    const last = recentMessages.get(key) ?? 0;
    if (rateLimitMs > 0 && now - last < rateLimitMs) {
      return;
    }
    recentMessages.set(key, now);

    const alerts = useAlertStore();
    const duration = _options?.duration ?? DEFAULTS.USER_INFO.DURATION.INFO;
    return alerts.info(_title, message, duration);
  }

  /**
   * Presents a message to the user using to confirm.
   *
   * @param _title - Contextual title or source of the message.
   * @param _error - The Error object.
   * @param _options - Extended options for alerts, notices, logging, and delays.
   * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
   */
  async function handleUserConfirm(
    _title: string,
    _error: Error | unknown,
    _options?: HandleUserAlertOptions
  ): Promise<boolean | void> {
    let message: string = "";
    // Normalize error input
    if (_error instanceof Error) {
      message = _error.message;
    } else if (_options?.noticeLines !== undefined) {
      message = _options.noticeLines.join("\n");
    } else {
      message = "Missing error";
    }

    // Rate limit identical messages per kind/title/message
    const rateLimitMs =
      _options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
    const key = `confirm|${_title}|${message}`;
    const now = Date.now();
    const last = recentMessages.get(key) ?? 0;
    if (rateLimitMs > 0 && now - last < rateLimitMs) {
      return;
    }
    recentMessages.set(key, now);

    const alerts = useAlertStore();
    return await alerts.confirm(_title, message, _options?.confirm);
  }

  /**
   * Presents a message to the user to show an error.
   *
   * @param _title - Contextual title or source of the message.
   * @param _error - The Error object.
   * @param _options - Extended options for alerts, notices, logging, and delays.
   * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
   */
  async function handleUserError(
    _title: string,
    _error: Error | unknown,
    _options: HandleUserAlertOptions
  ): Promise<number | void> {
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

    // Rate limit identical messages per kind/title/message
    const rateLimitMs =
      _options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
    const key = `error|${_title}|${message}`;
    const now = Date.now();
    const last = recentMessages.get(key) ?? 0;
    if (rateLimitMs > 0 && now - last < rateLimitMs) {
      return;
    }
    recentMessages.set(key, now);

    const alerts = useAlertStore();
    // Also report to the console
    DomainUtils.log(
      `USE_ALERT ${_title}: ${message}`.trim(),
      {
        ...((data as Record<string, unknown>) || {}),
        correlationId,
        errorStack
      },
      logLevel
    );
    const duration =
      _options?.duration ?? DEFAULTS.USER_INFO.DURATION.ERROR ?? null;
    return alerts.error(_title, message, duration);
  }

  return {
    handleUserInfo,
    handleUserConfirm,
    handleUserError
  };
}
