import { useAppConfig } from '@/composables/useAppConfig';
const { LOCAL_STORAGE } = useAppConfig();
export function useApp() {
    function utcDate(iso) {
        return new Date(`${iso}T00:00:00.000`);
    }
    function isoDate(ms) {
        return new Date(ms).toISOString().substring(0, 10);
    }
    function toNumber(str, locale) {
        if (str === null || str === undefined) {
            return 0;
        }
        if (typeof str === 'boolean') {
            return str ? 1 : 0;
        }
        if (typeof str === 'number') {
            return Number.isNaN(str) ? 0 : str;
        }
        let cleaned = str
            .toString()
            .trim()
            .replace(/\s|\t/g, '')
            .replace(/%$/g, '');
        if (cleaned === '') {
            return 0;
        }
        if (!locale) {
            const dotCount = (cleaned.match(/\./g) || []).length;
            const commaCount = (cleaned.match(/,/g) || []).length;
            const lastDot = cleaned.lastIndexOf('.');
            const lastComma = cleaned.lastIndexOf(',');
            if (commaCount === 0 && dotCount > 0) {
                locale = 'en';
            }
            else if (dotCount === 0 && commaCount > 0) {
                locale = (cleaned.length - lastComma <= 4) ? 'de' : 'en';
            }
            else if (lastComma > lastDot) {
                locale = 'de';
            }
            else {
                locale = 'en';
            }
        }
        if (locale === 'de') {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }
        else {
            cleaned = cleaned.replace(/,/g, '');
        }
        const result = Number.parseFloat(cleaned);
        return Number.isNaN(result) ? 0 : result;
    }
    function log(msg, mode) {
        const localDebug = localStorage.getItem(LOCAL_STORAGE.DEBUG.key);
        if (Number.parseInt(localDebug ?? '0') > 0) {
            if (mode?.info !== undefined) {
                console.info(msg, mode?.info);
            }
            else if (mode?.warn !== undefined) {
                console.warn(msg, mode?.warn);
            }
            else if (mode?.error !== undefined) {
                console.error(msg, mode?.error);
            }
            else {
                console.log(msg);
            }
        }
    }
    function mean(nar) {
        let sum = 0;
        let len = nar.length;
        for (const n of nar) {
            if (n !== 0 && !Number.isNaN(n)) {
                sum += n;
            }
            else {
                len--;
            }
        }
        return len > 0 ? sum / len : 0;
    }
    function haveSameStrings(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false;
        }
        const set1 = new Set(arr1);
        const set2 = new Set(arr2);
        if (set1.size !== set2.size) {
            return false;
        }
        for (const item of set1) {
            if (!set2.has(item)) {
                return false;
            }
        }
        return true;
    }
    return {
        utcDate,
        isoDate,
        toNumber,
        haveSameStrings,
        log,
        mean
    };
}
