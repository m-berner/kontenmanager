import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserInfo } from "@/composables/useUserInfo";
import { DEFAULTS } from "@/config/defaults";
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
    it("shows info alert with default duration and returns alert id", async () => {
        const { handleUserInfo } = useUserInfo();
        const id = await handleUserInfo("alert", "Title", "Message", {
            alertKind: "info"
        });
        expect(id).toBe(101);
        expect(alertStoreMock.info).toHaveBeenCalledWith("Title", "Message", DEFAULTS.USER_INFO.DURATION.INFO);
    });
    it("shows error alert with default null duration and returns alert id", async () => {
        const { handleUserInfo } = useUserInfo();
        const id = await handleUserInfo("alert", "Title", "Oops", {
            alertKind: "error"
        });
        expect(id).toBe(202);
        expect(alertStoreMock.error).toHaveBeenCalledWith("Title", "Oops", DEFAULTS.USER_INFO.DURATION.ERROR);
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
        const opts = { alertKind: "info", rateLimitMs: 10_000 };
        await handleUserInfo("alert", "RL", "Same", opts);
        await handleUserInfo("alert", "RL", "Same", opts);
        expect(alertStoreMock.info).toHaveBeenCalledTimes(1);
    });
});
