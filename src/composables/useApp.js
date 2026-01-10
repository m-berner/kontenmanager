import { useAppConfig } from '@/composables/useAppConfig';
const { DATE, LOCAL_STORAGE } = useAppConfig();
export function useApp() {
    function utcDate(iso) {
        if (!DATE.ISO_DATE_REGEX.test(iso) && iso !== '') {
            throw new Error(`Invalid ISO date format: ${iso}`);
        }
        return new Date(`${iso}T00:00:00.000`);
    }
    function isoDate(ms) {
        if (!Number.isFinite(ms)) {
            throw new Error(`Invalid timestamp: ${ms}`);
        }
        return new Date(ms).toISOString().substring(0, 10);
    }
    function isValidISODate(iso) {
        return DATE.ISO_DATE_REGEX.test(iso) && !isNaN(utcDate(iso).getTime());
    }
    function toNumber(value, options = {}) {
        const { locale, fallback = 0, throwOnError = false } = options;
        if (value === null || value === undefined)
            return fallback;
        if (typeof value === 'boolean')
            return value ? 1 : 0;
        if (typeof value === 'number') {
            return Number.isNaN(value) ? fallback : value;
        }
        const cleaned = value
            .toString()
            .trim()
            .replace(/\s|\t/g, '')
            .replace(/%$/g, '');
        if (cleaned === '')
            return fallback;
        const isParseError = () => {
            if (throwOnError) {
                throw new Error(`Cannot parse "${value}" as number`);
            }
        };
        try {
            const detectedLocale = locale || detectNumberFormat(cleaned);
            const normalized = normalizeNumber(cleaned, detectedLocale);
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
    function detectNumberFormat(str) {
        const dotCount = (str.match(/\./g) || []).length;
        const commaCount = (str.match(/,/g) || []).length;
        const lastDot = str.lastIndexOf('.');
        const lastComma = str.lastIndexOf(',');
        if (commaCount === 0 && dotCount > 0)
            return 'en';
        if (dotCount === 0 && commaCount > 0) {
            return (str.length - lastComma <= 4) ? 'de' : 'en';
        }
        return lastComma > lastDot ? 'de' : 'en';
    }
    function normalizeNumber(str, locale) {
        return locale === 'de'
            ? str.replace(/\./g, '').replace(',', '.')
            : str.replace(/,/g, '');
    }
    function log(msg, data, level = 'log') {
        const debugLevel = Number.parseInt(localStorage.getItem(LOCAL_STORAGE.DEBUG.key) ?? '0');
        if (debugLevel <= 0)
            return;
        console.error(msg, data);
        const logFn = console[level] || console.log;
        data !== undefined ? logFn(msg, data) : logFn(msg);
    }
    function mean(numbers) {
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
    function haveSameStrings(arr1, arr2) {
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
    function debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    }
    function throttle(fn, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    function memoize(fn) {
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
    function createCleanup() {
        const cleanupFns = [];
        return {
            add: (fn) => cleanupFns.push(fn),
            cleanup: () => cleanupFns.forEach(fn => fn())
        };
    }
    return {
        utcDate,
        isoDate,
        isValidISODate,
        toNumber,
        haveSameStrings,
        log,
        mean,
        debounce,
        throttle,
        createCleanup,
        memoize
    };
}
