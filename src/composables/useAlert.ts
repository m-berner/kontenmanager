/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import { useAlertStore } from "@/stores/alerts";
import { DEFAULTS } from "@/configs/defaults";
import type { HandleUserAlertOptions } from "@/types";
import { DomainUtils } from "@/domains/utils";
import { AppError } from "@/domains/errors";

/**
 * Message times queue.
 */
const recentMessages = new Map<string, number>();

/**
 *
 * @param title - Contextual title or source of the message.
 * @param error - The Error object.
 */
const normalizedParams = (title: string, error: string | Error | unknown) => {
  let messages: string[] = [];
  if (error instanceof AppError) {
    messages = [`${title}: ${error._category}`, error.message];
  } else if (error instanceof Error) {
    messages = [title, error.name, error.message];
  } else if (typeof error === "string") {
    messages = [title, error];
  } else if (Array.isArray(error)) {
    messages = [title, ...error];
  } else {
    messages = [title, "Unknown error"];
  }
  return messages.join("\n");
};

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
   * @param title - Contextual title or source of the message.
   * @param error - The Error object.
   * @param options - Extended options for alerts and delays.
   * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
   */
  async function handleUserInfo(
    title: string,
    error: string | string[]| Error | unknown,
    options?: HandleUserAlertOptions
  ): Promise<number | void> {
    const message = normalizedParams(title, error);

    // Rate limit identical messages per kind/title/message
    const rateLimitMs =
      options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
    const key = `info|${title}|${message}`;
    const now = Date.now();
    const last = recentMessages.get(key) ?? 0;
    if (rateLimitMs > 0 && now - last < rateLimitMs) {
      return;
    }
    recentMessages.set(key, now);

    const alerts = useAlertStore();
    const duration = options?.duration ?? DEFAULTS.USER_INFO.DURATION.INFO;
    return alerts.info(title, message, duration);
  }

  /**
   * Presents a message to the user using to confirm.
   *
   * @param title - Contextual title or source of the message.
   * @param error - The Error object.
   * @param options - Extended options for alerts and delays.
   * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
   */
  async function handleUserConfirm(
    title: string,
    error: string | string[] | Error | unknown,
    options?: HandleUserAlertOptions
  ): Promise<boolean | void> {
    const message = normalizedParams(title, error);

    // Rate limit identical messages per kind/title/message
    const rateLimitMs =
      options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
    const key = `confirm|${title}|${message}`;
    const now = Date.now();
    const last = recentMessages.get(key) ?? 0;
    if (rateLimitMs > 0 && now - last < rateLimitMs) {
      return;
    }
    recentMessages.set(key, now);

    const alerts = useAlertStore();
    return await alerts.confirm(title, message, options?.confirm);
  }

  /**
   * Presents a message to the user to show an error.
   *
   * @param title - Contextual title or source of the message.
   * @param error - The Error object.
   * @param options - Extended options for alerts and delays.
   * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
   */
  async function handleUserError(
    title: string,
    error: string | string[] | Error | unknown,
    options: HandleUserAlertOptions
  ): Promise<number | void> {
    const { data, logLevel = "log", correlationId } = options;
    let errorStack: string | undefined;
    if (error instanceof Error) {
      errorStack = error.stack;
    }
    const message = normalizedParams(title, error);

    // Rate limit identical messages per kind/title/message
    const rateLimitMs =
      options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
    const key = `error|${title}|${message}`;
    const now = Date.now();
    const last = recentMessages.get(key) ?? 0;
    if (rateLimitMs > 0 && now - last < rateLimitMs) {
      return;
    }
    recentMessages.set(key, now);

    const alerts = useAlertStore();
    // Also report to the console
    DomainUtils.log(
      `USE_ALERT ${title}: ${message}`.trim(),
      {
        ...((data as Record<string, unknown>) || {}),
        correlationId,
        errorStack
      },
      logLevel
    );
    const duration =
      options?.duration ?? DEFAULTS.USER_INFO.DURATION.ERROR;
    return alerts.error(title, message, duration);
  }

  return {
    handleUserInfo,
    handleUserConfirm,
    handleUserError
  };
}

DomainUtils.log("COMPOSABLE useAlert");
