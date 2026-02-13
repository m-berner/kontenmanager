import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAlert } from "@/composables/useAlert";
import { DEFAULTS } from "@/configs/defaults";
import { useBrowser } from "@/composables/useBrowser";
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
describe("useAlert", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("shows info alert with default duration and returns alert id", async () => {
        const { handleUserInfo } = useAlert();
        const id = await handleUserInfo("Title", new Error("Message"), { duration: DEFAULTS.USER_INFO.DURATION.INFO });
        expect(id).toBe(101);
        expect(alertStoreMock.info).toHaveBeenCalledWith("Title", "Error\nMessage", DEFAULTS.USER_INFO.DURATION.INFO);
    });
    it("shows error alert with default null duration and returns alert id", async () => {
        const { handleUserError } = useAlert();
        const id = await handleUserError("Title", new Error("Oops"), {});
        expect(id).toBe(202);
        expect(alertStoreMock.error).toHaveBeenCalledWith("Title", "Error\nOops", DEFAULTS.USER_INFO.DURATION.ERROR);
    });
    it("shows confirm dialog and returns boolean", async () => {
        const { handleUserConfirm } = useAlert();
        const res = await handleUserConfirm("Confirm?", new Error("Are you sure?"));
        expect(res).toBe(true);
        expect(alertStoreMock.confirm).toHaveBeenCalledWith("Confirm?", "Error\nAre you sure?", undefined);
    });
    it("sends notice via useBrowser", async () => {
        const { handleUserNotice } = useBrowser();
        await handleUserNotice("Title", "OK");
        expect(noticeFn).toHaveBeenCalledWith("Title", "OK");
    });
    it("rate-limits duplicate messages within window", async () => {
        const { handleUserInfo } = useAlert();
        const opts = { alertKind: "info", rateLimitMs: 10_000 };
        await handleUserInfo("RL", new Error("Same"), opts);
        await handleUserInfo("RL", new Error("Same"), opts);
        expect(alertStoreMock.info).toHaveBeenCalledTimes(1);
    });
});
