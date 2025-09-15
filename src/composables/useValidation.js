import { useRecordsStore } from '@/stores/records';
export const useValidation = () => {
    const ibanRules = (msgArray) => {
        const ibanLengths = {
            AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22,
            BH: 22, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22,
            DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27,
            GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28,
            IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
            LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22,
            MK: 19, MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28,
            PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SE: 24, SI: 19,
            SK: 24, SM: 27, TN: 24, TR: 26, UA: 29, VG: 24, XK: 20
        };
        return [
            (v) => v !== null || msgArray[0],
            (v) => {
                const countryCode = v.replace(/\s/g, '').substring(0, 2);
                const expectedLength = ibanLengths[countryCode];
                return !!expectedLength || msgArray[1];
            },
            (v) => {
                const countryCode = v.replace(/\s/g, '').substring(0, 2);
                return v.replace(/\s/g, '').length === ibanLengths[countryCode] || msgArray[2];
            },
            (v) => v.replace(/\s/g, '').match(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/) !== null || msgArray[3],
            (v) => {
                const rearranged = v.replace(/\s/g, '').substring(4) + v.replace(/\s/g, '').substring(0, 4);
                const numericString = rearranged.replace(/[A-Z]/g, (char) => {
                    return (char.charCodeAt(0) - 55).toString();
                });
                const remainder = BigInt(numericString) % 97n;
                return remainder === 1n || msgArray[4];
            }
        ];
    };
    const ibanDuplicateRule = (msgArray) => {
        return [
            (v) => {
                const records = useRecordsStore();
                return !records.accounts.isDuplicate(v.replace(/\s/g, '')) || msgArray[5];
            }
        ];
    };
    const valNameRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length < 32) || msgArray[1],
            (v) => v.match(/[^a-zA-Z\-äöüÄÖÜ]/g) === null || msgArray[2]
        ];
    };
    const swiftRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v.replace(/\s/g, '').length === 8 || v.replace(/\s/g, '').length === 11) || msgArray[1],
            (v) => v.replace(/\s/g, '').match(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/) !== null || msgArray[2],
            (v) => v.replace(/\s/g, '').substring(0, 4).match(/^[A-Z]{4}$/) !== null || msgArray[3],
            (v) => v.replace(/\s/g, '').substring(4, 6).match(/^[A-Z]{2}$/) !== null || msgArray[4],
            (v) => v.replace(/\s/g, '').substring(6, 8).match(/^[A-Z0-9]{2}$/) !== null || msgArray[5],
            (v) => {
                const branchCode = v.replace(/\s/g, '').length === 11 ? v.replace(/\s/g, '').substring(8, 11) : null;
                return branchCode?.match(/^[A-Z0-9]{3}$/) !== null || msgArray[6];
            },
            (v) => !v.replace(/\s/g, '').substring(6, 8).startsWith('0') || msgArray[7],
            (v) => !v.replace(/\s/g, '').substring(6, 8).endsWith('1') || msgArray[8]
        ];
    };
    const valDateRules = (msgArray) => {
        return [
            (v) => (v !== null && v.match(/^([1-2])?[0-9]{3}-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])$/g) !== null) || msgArray[0]
        ];
    };
    const valCurrencyCodeRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length === 3) || msgArray[1],
            (v) => v.match(/[^a-zA-Z]/g) === null || msgArray[2]
        ];
    };
    const valRequiredRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0]
        ];
    };
    const valPositiveIntegerRules = (msgArray) => {
        return [
            (v) => v > 0 || msgArray[0]
        ];
    };
    const requiredSelect = (msgArray) => {
        return [
            (v) => (v === null || v.length > 0) || msgArray[0]
        ];
    };
    const requiredSelectNumber = (msgArray) => {
        return [
            (v) => v > 0 || msgArray[0]
        ];
    };
    const validateForm = async (form) => {
        if (form.value !== null) {
            const { valid } = await form.value.validate();
            return valid;
        }
        return false;
    };
    return {
        ibanRules,
        ibanDuplicateRule,
        valNameRules,
        swiftRules,
        valDateRules,
        valCurrencyCodeRules,
        valRequiredRules,
        valPositiveIntegerRules,
        requiredSelect,
        requiredSelectNumber,
        validateForm
    };
};
