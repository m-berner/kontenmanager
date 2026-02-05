import { DomainUtils } from "@/domains/utils";
import { useAlertStore } from "@/stores/alerts";
import { useBrowser } from "@/composables/useBrowser";
import { DEFAULTS } from "@/config/defaults";
const recentMessages = new Map();
export function useUserInfo() {
    async function handleUserInfo(mode, title, messageOrError, options = {}) {
        const { data, logLevel = "log", delay = null, correlationId } = options;
        let message = "";
        let errorStack;
        if (messageOrError instanceof Error) {
            message = messageOrError.message || String(messageOrError);
            errorStack = messageOrError.stack;
        }
        else {
            message = messageOrError;
        }
        const rateLimitMs = options.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
        const effectiveKind = options.alertKind ?? (logLevel === "error" ? "error" : "info");
        const key = `${mode}|${effectiveKind}|${title}|${message}`;
        const now = Date.now();
        const last = recentMessages.get(key) ?? 0;
        if (rateLimitMs > 0 && now - last < rateLimitMs) {
            return;
        }
        recentMessages.set(key, now);
        if (mode === "console") {
            DomainUtils.log(`${title}: ${message}`.trim(), {
                ...(data || {}),
                correlationId,
                errorStack
            }, logLevel);
            return;
        }
        if (mode === "alert") {
            let alerts = null;
            try {
                alerts = useAlertStore();
            }
            catch {
                DomainUtils.log(`ALERT_FALLBACK ${title}: ${message}`.trim(), {
                    ...(data || {}),
                    correlationId,
                    errorStack
                }, logLevel);
                return;
            }
            const kind = effectiveKind;
            if (kind === "confirm") {
                return await alerts.confirm(title, message, options.confirm);
            }
            if (kind === "error") {
                const duration = options.duration ?? DEFAULTS.USER_INFO.DURATION.ERROR ?? null;
                return alerts.error(title, message, duration);
            }
            const duration = options.duration ?? DEFAULTS.USER_INFO.DURATION.INFO;
            return alerts.info(title, message, duration);
        }
        if (mode === "notice") {
            let notice = null;
            try {
                ({ notice } = useBrowser());
            }
            catch {
                DomainUtils.log(`NOTICE_FALLBACK ${title}: ${message}`.trim(), {
                    ...(data || {}),
                    correlationId,
                    errorStack
                }, logLevel);
                return;
            }
            const lines = options.noticeLines && options.noticeLines.length > 0
                ? options.noticeLines
                : [title, message].filter(Boolean);
            if (delay && delay > 0) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
            if (notice) {
                await notice(lines);
            }
            return;
        }
        DomainUtils.log(`${title}: ${message}`.trim(), data ?? null, logLevel);
    }
    return {
        handleUserInfo
    };
}
