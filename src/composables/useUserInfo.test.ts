/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserInfo } from "@/composables/useUserInfo";
import { DEFAULTS } from "@/config/defaults";
import { useBrowser } from "@/composables/useBrowser";

// Mocks
const alertStoreMock = {
  info: vi.fn().mockReturnValue(101),
  error: vi.fn().mockReturnValue(202),
  confirm: vi.fn().mockResolvedValue(true)
};

vi.mock("@/stores/alerts", () => ({
  useAlertStore: () => alertStoreMock
}));

const noticeFn = vi.fn().mockResolvedValue(undefined);
vi.mock("@/composables/useBrowser", () => ({
  useBrowser: () => ({ handleUserNotice: noticeFn })
}));

describe("useUserInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows info alert with default duration and returns alert id", async () => {
    const { handleUserInfo } = useUserInfo();
    const id = await handleUserInfo("alert", "Title", new Error("Message"), {
      alertKind: "info"
    });
    expect(id).toBe(101);
    expect(alertStoreMock.info).toHaveBeenCalledWith(
      "Title",
      "Message",
      DEFAULTS.USER_INFO.DURATION.INFO
    );
  });

  it("shows error alert with default null duration and returns alert id", async () => {
    const { handleUserInfo } = useUserInfo();
    const id = await handleUserInfo("alert", "Title", new Error("Oops"), {
      alertKind: "error"
    });
    expect(id).toBe(202);
    expect(alertStoreMock.error).toHaveBeenCalledWith(
      "Title",
      "Oops",
      DEFAULTS.USER_INFO.DURATION.ERROR
    );
  });

  it("shows confirm dialog and returns boolean", async () => {
    const { handleUserInfo } = useUserInfo();
    const res = await handleUserInfo(
      "alert",
      "Confirm?",
      new Error("Are you sure?"),
      {
        alertKind: "confirm"
      }
    );
    expect(res).toBe(true);
    expect(alertStoreMock.confirm).toHaveBeenCalled();
  });

  it("sends notice via useBrowser", async () => {
    const { handleUserNotice } = useBrowser();
    await handleUserNotice("Title",  "OK");
    expect(noticeFn).toHaveBeenCalledWith("Title", "OK");
  });

  it("rate-limits duplicate messages within window", async () => {
    const { handleUserInfo } = useUserInfo();
    const opts = { alertKind: "info" as const, rateLimitMs: 10_000 };
    await handleUserInfo("alert", "RL", new Error("Same"), opts);
    await handleUserInfo("alert", "RL", new Error("Same"), opts);
    // first call handled once
    expect(alertStoreMock.info).toHaveBeenCalledTimes(1);
  });
});
