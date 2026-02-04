/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUserInfo } from "@/composables/useUserInfo";
import { DomainUtils } from "@/domains/utils";
import { DEFAULTS } from "@/config/defaults";

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
  useBrowser: () => ({ notice: noticeFn })
}));

describe("useUserInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs to console mode with Error normalization and correlationId", async () => {
    const spy = vi.spyOn(DomainUtils, "log").mockImplementation(() => {});
    const { handleUserInfo } = useUserInfo();
    const err = new Error("Boom");
    await handleUserInfo("console", "Test", err, { correlationId: "cid-1" });
    expect(spy).toHaveBeenCalledTimes(1);
    const [msg, data, level] = spy.mock.calls[0];
    expect(msg).toContain("Test: Boom");
    expect(level).toBe("log");
    expect(data).toMatchObject({ correlationId: "cid-1" });
    spy.mockRestore();
  });

  it("shows info alert with default duration and returns alert id", async () => {
    const { handleUserInfo } = useUserInfo();
    const id = await handleUserInfo("alert", "Title", "Message", {
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
    const id = await handleUserInfo("alert", "Title", "Oops", {
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
    const res = await handleUserInfo("alert", "Confirm?", "Are you sure?", {
      alertKind: "confirm"
    });
    expect(res).toBe(true);
    expect(alertStoreMock.confirm).toHaveBeenCalled();
  });

  it("sends notice via useBrowser", async () => {
    const { handleUserInfo } = useUserInfo();
    await handleUserInfo("notice", "Title", "Message");
    expect(noticeFn).toHaveBeenCalledWith(["Title", "Message"]);
  });

  it("rate-limits duplicate messages within window", async () => {
    const { handleUserInfo } = useUserInfo();
    const opts = { alertKind: "info" as const, rateLimitMs: 10_000 };
    await handleUserInfo("alert", "RL", "Same", opts);
    await handleUserInfo("alert", "RL", "Same", opts);
    // first call handled once
    expect(alertStoreMock.info).toHaveBeenCalledTimes(1);
  });
});
