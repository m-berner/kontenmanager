import { useAlertStore } from "@/stores/alerts";
import { DEFAULTS } from "@/configs/defaults";
import { DomainUtils } from "@/domains/utils";
import { AppError } from "@/domains/errors";
const recentMessages = new Map();
const normalizedParams = (title, error) => {
    let messages = [];
    if (error instanceof AppError) {
        messages = [`${title}: ${error._category}`, error.message];
    }
    else if (error instanceof Error) {
        messages = [title, error.name, error.message];
    }
    else if (typeof error === "string") {
        messages = [title, error];
    }
    else if (Array.isArray(error)) {
        messages = [title, ...error];
    }
    else {
        messages = [title, "Unknown error"];
    }
    return messages.join("\n");
};
export function useAlert() {
    async function handleUserInfo(title, error, options) {
        const message = normalizedParams(title, error);
        const rateLimitMs = options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
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
    async function handleUserConfirm(title, error, options) {
        const message = normalizedParams(title, error);
        const rateLimitMs = options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
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
    async function handleUserError(title, error, options) {
        const { data, logLevel = "log", correlationId } = options;
        let errorStack;
        if (error instanceof Error) {
            errorStack = error.stack;
        }
        const message = normalizedParams(title, error);
        const rateLimitMs = options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
        const key = `error|${title}|${message}`;
        const now = Date.now();
        const last = recentMessages.get(key) ?? 0;
        if (rateLimitMs > 0 && now - last < rateLimitMs) {
            return;
        }
        recentMessages.set(key, now);
        const alerts = useAlertStore();
        DomainUtils.log(`COMPOSABLES useAlert ${title}: ${message}`.trim(), {
            ...(data || {}),
            correlationId,
            errorStack
        }, logLevel);
        const duration = options?.duration ?? DEFAULTS.USER_INFO.DURATION.ERROR;
        return alerts.error(title, message, duration);
    }
    return {
        handleUserInfo,
        handleUserConfirm,
        handleUserError
    };
}
DomainUtils.log("COMPOSABLES useAlert");
