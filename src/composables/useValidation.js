import { useRecordsStore } from '@/stores/records';
import { useApp } from '@/composables/useApp';
const { toNumber } = useApp();
export const useValidation = () => {
    function ibanRules(msgArray) {
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
    }
    function ibanDuplicateRules(msgArray) {
        return [
            (v) => {
                const records = useRecordsStore();
                return !records.accounts.isDuplicate(v.replace(/\s/g, '')) || msgArray[5];
            }
        ];
    }
    function nameRules(msgArray) {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length < 32) || msgArray[1],
            (v) => v.match(/^[a-zA-ZäöüÄÖÜ].*/g) !== null || msgArray[2]
        ];
    }
    function swiftRules(msgArray) {
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
            (v) => !v.replace(/\s/g, '').substring(6, 8).startsWith('0') || msgArray[7]
        ];
    }
    function dateRules(msgArray) {
        return [
            (v) => (v !== null && v.match(/^([1-2])?[0-9]{3}-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])$/g) !== null) || msgArray[0]
        ];
    }
    function valCurrencyCodeRules(msgArray) {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length === 3) || msgArray[1],
            (v) => v.match(/[^a-zA-Z]/g) === null || msgArray[2]
        ];
    }
    function requiredRules(msgArray) {
        return [
            (v) => {
                return (v !== null && v !== '' && v !== undefined) || msgArray[0];
            }
        ];
    }
    function isGreaterZeroRules(msgArray) {
        return [
            (v) => {
                return toNumber(v) >= 0 || msgArray[0];
            }
        ];
    }
    function requiredSelect(msgArray) {
        return [
            (v) => (v === null || v.length > 0) || msgArray[0]
        ];
    }
    function requiredSelectNumber(msgArray) {
        return [
            (v) => v > 0 || msgArray[0]
        ];
    }
    async function validateForm(form) {
        console.error(form.value);
        if (form.value !== null) {
            const { valid } = await form.value.validate();
            return valid;
        }
        return false;
    }
    function isinRules(msgArray) {
        const validCountryCodes = [
            'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
            'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
            'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
            'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
            'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
            'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK',
            'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
            'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
            'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
            'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
            'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
            'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
            'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
            'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP',
            'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
            'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
            'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM',
            'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
            'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
            'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
            'VN', 'VU', 'WF', 'WS', 'XS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
        ];
        return [
            (v) => v !== null || msgArray[0],
            (v) => {
                const cleanISIN = v.replace(/\s/g, '').toUpperCase();
                return cleanISIN.length === 12 || msgArray[1];
            },
            (v) => {
                const cleanISIN = v.replace(/\s/g, '').toUpperCase();
                return cleanISIN.match(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/) !== null || msgArray[2];
            },
            (v) => {
                const cleanISIN = v.replace(/\s/g, '').toUpperCase();
                const countryCode = cleanISIN.substring(0, 2);
                return validCountryCodes.includes(countryCode) || msgArray[3];
            },
            (v) => {
                const cleanISIN = v.replace(/\s/g, '').toUpperCase();
                const digits = cleanISIN.substring(0, 11);
                let numericString = '';
                for (const char of digits) {
                    if (char >= 'A' && char <= 'Z') {
                        numericString += (char.charCodeAt(0) - 55).toString();
                    }
                    else {
                        numericString += char;
                    }
                }
                let sum = 0;
                let alternate = true;
                for (let i = numericString.length - 1; i >= 0; i--) {
                    let digit = parseInt(numericString[i]);
                    if (alternate) {
                        digit *= 2;
                        if (digit > 9) {
                            digit = Math.floor(digit / 10) + (digit % 10);
                        }
                    }
                    sum += digit;
                    alternate = !alternate;
                }
                const checkDigit = (10 - (sum % 10)) % 10;
                const providedCheckDigit = parseInt(cleanISIN[11]);
                return checkDigit === providedCheckDigit || msgArray[4];
            }
        ];
    }
    return {
        ibanRules,
        ibanDuplicateRules,
        isinRules,
        nameRules,
        swiftRules,
        dateRules,
        valCurrencyCodeRules,
        requiredRules,
        isGreaterZeroRules,
        requiredSelect,
        requiredSelectNumber,
        validateForm
    };
};
