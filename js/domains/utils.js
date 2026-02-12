import { DATE } from "@/domains/configs/date";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
export class DomainUtils {
    constructor() { }
    static utcDate(iso) {
        if (!DATE.ISO_DATE_REGEX.test(iso) && iso !== "") {
            throw new AppError(ERROR_CODES.UTILS.A, ERROR_CATEGORY.VALIDATION, false);
        }
        if (iso === "")
            return new Date(NaN);
        const [y, m, d] = iso.split("-").map((v) => Number(v));
        if (!(m >= 1 && m <= 12)) {
            throw new AppError(ERROR_CODES.UTILS.A, ERROR_CATEGORY.VALIDATION, false);
        }
        const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
        if (!(d >= 1 && d <= daysInMonth)) {
            throw new AppError(ERROR_CODES.UTILS.A, ERROR_CATEGORY.VALIDATION, false);
        }
        return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    }
    static isoDate(ms) {
        if (!Number.isFinite(ms)) {
            throw new AppError(ERROR_CODES.UTILS.B, ERROR_CATEGORY.VALIDATION, false);
        }
        return new Date(ms).toISOString().substring(0, 10);
    }
    static isValidISODate(iso) {
        if (!DATE.ISO_DATE_REGEX.test(iso))
            return false;
        const [y, m, d] = iso.split("-").map((v) => Number(v));
        if (!(m >= 1 && m <= 12))
            return false;
        const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
        return d >= 1 && d <= daysInMonth;
    }
    static toNumber(value, options = {}) {
        const { locale, fallback = 0, throwOnError = false } = options;
        if (value === null || value === undefined)
            return fallback;
        if (typeof value === "boolean")
            return value ? 1 : 0;
        if (typeof value === "number") {
            return Number.isNaN(value) ? fallback : value;
        }
        const cleaned = value
            .toString()
            .trim()
            .replace(/\s|\t/g, "")
            .replace(/%$/g, "");
        if (cleaned === "")
            return fallback;
        const isParseError = () => {
            if (throwOnError) {
                throw new AppError(ERROR_CODES.UTILS.C, ERROR_CATEGORY.VALIDATION, false);
            }
        };
        try {
            const detectedLocale = locale || DomainUtils.detectNumberFormat(cleaned);
            const normalized = DomainUtils.normalizeNumber(cleaned, detectedLocale);
            const result = Number.parseFloat(normalized);
            if (Number.isNaN(result)) {
                isParseError();
                return fallback;
            }
            return result;
        }
        catch (error) {
            if (throwOnError)
                throw error;
            return fallback;
        }
    }
    static detectNumberFormat(str) {
        const dotCount = (str.match(/\./g) || []).length;
        const commaCount = (str.match(/,/g) || []).length;
        const lastDot = str.lastIndexOf(".");
        const lastComma = str.lastIndexOf(",");
        if (commaCount === 0 && dotCount > 0)
            return "en";
        if (dotCount === 0 && commaCount > 0) {
            return str.length - lastComma <= 4 ? "de" : "en";
        }
        return lastComma > lastDot ? "de" : "en";
    }
    static normalizeNumber(str, locale) {
        return locale === "de"
            ? str.replace(/\./g, "").replace(",", ".")
            : str.replace(/,/g, "");
    }
    static normalizeBookingTypeName(name) {
        return name.trim().replace(/\s+/g, " ");
    }
    static log(msg, data, level) {
        if (import.meta.env.MODE !== "development")
            return;
        const logFn = level === undefined ? console.log : console[level];
        data !== undefined ? logFn(msg, data) : logFn(msg);
    }
    static mean(numbers) {
        if (numbers.length === 0)
            return 0;
        let sum = 0;
        let count = 0;
        for (const n of numbers) {
            if (n !== 0 && Number.isFinite(n)) {
                sum += n;
                count++;
            }
        }
        return count > 0 ? sum / count : 0;
    }
    static haveSameStrings(arr1, arr2) {
        if (arr1.length !== arr2.length)
            return false;
        const set1 = new Set(arr1);
        const set2 = new Set(arr2);
        if (set1.size !== set2.size)
            return false;
        for (const item of set1) {
            if (!set2.has(item))
                return false;
        }
        return true;
    }
    static winLossClass(value) {
        return value < 0
            ? "color-red font-weight-bold"
            : "color-black font-weight-bold";
    }
    static debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    }
    static throttle(fn, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn(...args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }
    static memorize(fn) {
        const cache = new Map();
        return ((...args) => {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn(...args);
            cache.set(key, result);
            return result;
        });
    }
    static createCleanup() {
        const cleanupFns = [];
        return {
            add: (fn) => cleanupFns.push(fn),
            cleanup: () => cleanupFns.forEach((fn) => fn())
        };
    }
}
