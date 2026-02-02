import { UtilsService } from "@/domains/utils";
import { useAlertStore } from "@/stores/alerts";
import { useBrowser } from "@/composables/useBrowser";
export function useUserInfo() {
    async function handleUserInfo(mode, title, message, options = {}) {
        const { data, logLevel = "log", delay = null } = options;
        if (mode === "console") {
            UtilsService.log(`${title}: ${message}`.trim(), data, logLevel);
            return;
        }
        if (mode === "alert") {
            const alerts = useAlertStore();
            const kind = options.alertKind ?? (logLevel === "error" ? "error" : "info");
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
            const lines = options.noticeLines && options.noticeLines.length > 0
                ? options.noticeLines
                : [title, message].filter(Boolean);
            if (delay && delay > 0) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
            await notice(lines);
            return;
        }
        UtilsService.log(`${title}: ${message}`.trim(), data ?? null, logLevel);
    }
    return {
        handleUserInfo
    };
}
