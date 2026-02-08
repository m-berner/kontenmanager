import { useAlertStore } from "@/stores/alerts";
import { DEFAULTS } from "@/config/defaults";
import { DomainUtils } from "@/domains/utils";
const recentMessages = new Map();
export function useAlert() {
    async function handleUserInfo(_title, _error, _options) {
        let message = "";
        if (_error instanceof Error) {
            message = _error.message;
        }
        else {
            message = "Missing error";
        }
        const rateLimitMs = _options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
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
    async function handleUserConfirm(_title, _error, _options) {
        let message = "";
        if (_error instanceof Error) {
            message = _error.message;
        }
        else if (_options?.noticeLines !== undefined) {
            message = _options.noticeLines.join("\n");
        }
        else {
            message = "Missing error";
        }
        const rateLimitMs = _options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
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
    async function handleUserError(_title, _error, _options) {
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
        const rateLimitMs = _options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
        const key = `error|${_title}|${message}`;
        const now = Date.now();
        const last = recentMessages.get(key) ?? 0;
        if (rateLimitMs > 0 && now - last < rateLimitMs) {
            return;
        }
        recentMessages.set(key, now);
        const alerts = useAlertStore();
        DomainUtils.log(`USE_ALERT ${_title}: ${message}`.trim(), {
            ...(data || {}),
            correlationId,
            errorStack
        }, logLevel);
        const duration = _options?.duration ?? DEFAULTS.USER_INFO.DURATION.ERROR ?? null;
        return alerts.error(_title, message, duration);
    }
    return {
        handleUserInfo,
        handleUserConfirm,
        handleUserError
    };
}
