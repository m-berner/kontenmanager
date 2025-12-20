import { useAppConfig } from '@/composables/useAppConfig';
const { LOCAL_STORAGE } = useAppConfig();
export function useApp() {
    function utcDate(iso) {
        return new Date(`${iso}T00:00:00.000`);
    }
    function isoDate(ms) {
        return new Date(ms).toISOString().substring(0, 10);
    }
    function toNumber(str) {
        let result = 0;
        if (str !== null && str !== undefined) {
            const a = str.toString().replace(/,$/g, '');
            const b = a.split(',');
            if (b.length === 2) {
                const tmp2 = a
                    .trim()
                    .replace(/\s|\.|\t|%/g, '')
                    .replace(',', '.');
                result = Number.isNaN(Number.parseFloat(tmp2))
                    ? 0
                    : Number.parseFloat(tmp2);
            }
            else if (b.length > 2) {
                let tmp = '';
                for (let i = b.length - 1; i > 0; i--) {
                    tmp += b[i];
                }
                const tmp2 = `${tmp}.${b[0]}`;
                result = Number.isNaN(Number.parseFloat(tmp2))
                    ? 0
                    : Number.parseFloat(tmp2);
            }
            else {
                result = Number.isNaN(parseFloat(b[0])) ? 0 : Number.parseFloat(b[0]);
            }
        }
        return result;
    }
    function log(msg, mode) {
        const localDebug = localStorage.getItem(LOCAL_STORAGE.PROPS.DEBUG);
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
