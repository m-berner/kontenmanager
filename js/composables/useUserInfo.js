import { DomainUtils } from "@/domains/utils";
import { useAlertStore } from "@/stores/alerts";
import { DEFAULTS } from "@/config/defaults";
const recentMessages = new Map();
export function useUserInfo() {
    async function handleUserInfo(_mode, _title, _error, _options = {}) {
        const { data, logLevel = "log", correlationId } = _options;
        let message = "";
        let errorStack;
        if (_error instanceof Error) {
            message = _error.message;
            errorStack = _error.stack;
        }
        else {
            message = "Missing error";
        }
        const rateLimitMs = _options.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
        const effectiveKind = _options.alertKind ?? (logLevel === "error" ? "error" : "info");
        const key = `${_mode}|${effectiveKind}|${_title}|${message}`;
        const now = Date.now();
        const last = recentMessages.get(key) ?? 0;
        if (rateLimitMs > 0 && now - last < rateLimitMs) {
            return;
        }
        recentMessages.set(key, now);
        if (_mode === "alert") {
            let alerts = null;
            try {
                alerts = useAlertStore();
            }
            catch {
                DomainUtils.log(`ALERT_FALLBACK ${_title}: ${message}`.trim(), {
                    ...(data || {}),
                    correlationId,
                    errorStack
                }, logLevel);
                return;
            }
            const kind = effectiveKind;
            if (kind === "confirm") {
                return await alerts.confirm(_title, message, _options.confirm);
            }
            if (kind === "error") {
                const duration = _options.duration ?? DEFAULTS.USER_INFO.DURATION.ERROR ?? null;
                return alerts.error(_title, message, duration);
            }
            const duration = _options.duration ?? DEFAULTS.USER_INFO.DURATION.INFO;
            return alerts.info(_title, message, duration);
        }
        DomainUtils.log(`${_title}: ${message}`.trim(), data ?? null, logLevel);
    }
    return {
        handleUserInfo
    };
}
