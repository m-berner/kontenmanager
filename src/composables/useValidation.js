import { useAppConfig } from '@/composables/useAppConfig';
const { VALIDATIONS } = useAppConfig();
export function useValidation() {
    function createRule(validator, message) {
        return (value) => validator(value) || message;
    }
    function cleanString(value) {
        if (typeof value !== 'string')
            return null;
        return value.replace(/\s/g, '');
    }
    function convertToNumericString(text) {
        return Array.from(text).map(char => {
            if (char >= 'A' && char <= 'Z') {
                return (char.charCodeAt(0) - VALIDATIONS.CHAR_CODE_OFFSET).toString();
            }
            return char;
        }).join('');
    }
    const rules = {
        required: (message) => {
            return createRule((v) => v !== null && v !== '' && v !== undefined, message);
        },
        stringLength: (min, max, message) => {
            return createRule((v) => {
                const cleaned = cleanString(v);
                if (!cleaned)
                    return false;
                return cleaned.length >= min && cleaned.length <= max;
            }, message);
        },
        regex: (pattern, message) => {
            return createRule((v) => {
                const cleaned = cleanString(v);
                if (!cleaned)
                    return false;
                return pattern.test(cleaned);
            }, message);
        },
        oneOfTwo: (zeroValue, message) => {
            return createRule((v) => {
                if (typeof v !== 'number' || v < 0)
                    return false;
                const zero = typeof zeroValue === 'number' ? zeroValue : zeroValue.value;
                return !(v > 0 && zero > 0);
            }, message);
        }
    };
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
    function ibanRules(msgArray) {
        const ibanLength = createRule(v => {
            const cleaned = cleanString(v);
            if (!cleaned)
                return false;
            const countryCode = cleaned.substring(0, 2);
            return cleaned.length === ibanLengths[countryCode];
        }, msgArray[1]);
        const ibanChecksum = createRule(v => {
            const cleaned = cleanString(v);
            if (!cleaned)
                return false;
            const rearranged = cleaned.substring(4) + cleaned.substring(0, 4);
            const numericString = convertToNumericString(rearranged);
            return BigInt(numericString) % VALIDATIONS.MOD_97 === 1n;
        }, msgArray[3]);
        return [
            rules.required(msgArray[0]),
            ibanLength,
            rules.regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, msgArray[2]),
            ibanChecksum
        ];
    }
    const validCountryCodes = new Set([
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
    ]);
    function calculateLuhnCheckDigit(numericString, base) {
        let sum = 0;
        let alternate = true;
        for (let i = numericString.length - 1; i >= 0; i--) {
            let digit = parseInt(numericString[i], 10);
            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit = Math.floor(digit / base) + (digit % base);
                }
            }
            sum += digit;
            alternate = !alternate;
        }
        return (base - (sum % base)) % base;
    }
    function isinRules(msgArray) {
        const countryCode = createRule(v => {
            const cleaned = cleanString(v);
            if (!cleaned)
                return false;
            const cc = cleaned.toUpperCase().substring(0, 2);
            return validCountryCodes.has(cc);
        }, msgArray[3]);
        const checkSum = createRule(v => {
            try {
                const cleaned = cleanString(v);
                if (!cleaned)
                    return false;
                const upper = cleaned.toUpperCase();
                const digits = upper.substring(0, 11);
                const numericString = convertToNumericString(digits);
                const checkDigit = calculateLuhnCheckDigit(numericString, VALIDATIONS.LUHN_BASE);
                const providedCheckDigit = parseInt(upper[11], 10);
                return checkDigit === providedCheckDigit;
            }
            catch {
                return false;
            }
        }, msgArray[4]);
        return [
            rules.required(msgArray[0]),
            rules.stringLength(12, 12, msgArray[1]),
            rules.regex(/^[A-Za-z]{2}[A-Za-z0-9]{9}[0-9]$/, msgArray[2]),
            countryCode,
            checkSum
        ];
    }
    function swiftRules(msgArray) {
        const swiftLength = createRule(v => {
            const cleaned = cleanString(v);
            return cleaned ? (cleaned.length === 8 || cleaned.length === 11) : false;
        }, msgArray[1]);
        const branchCode = createRule((v) => {
            const cleaned = cleanString(v);
            if (!cleaned || cleaned.length !== 11)
                return true;
            const branch = cleaned.substring(8, 11);
            return /^[A-Z0-9]{3}$/.test(branch);
        }, msgArray[6]);
        const subRegex = (start, end, pattern, message) => {
            return createRule((v) => {
                const cleaned = cleanString(v);
                if (!cleaned)
                    return false;
                const ttv = cleaned.substring(start, end);
                return pattern.test(ttv);
            }, message);
        };
        const startsWith = (start, end, message) => {
            return createRule((v) => {
                const cleaned = cleanString(v);
                if (!cleaned)
                    return false;
                const ttv = cleaned.substring(start, end);
                return !ttv.startsWith('0');
            }, message);
        };
        return [
            rules.required(msgArray[0]),
            swiftLength,
            rules.regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, msgArray[2]),
            subRegex(0, 4, /^[A-Z]{4}$/, msgArray[3]),
            subRegex(4, 6, /^[A-Z]{2}$/, msgArray[4]),
            subRegex(6, 8, /^[A-Z0-9]{2}$/, msgArray[5]),
            branchCode,
            startsWith(6, 8, msgArray[7])
        ];
    }
    function isoDateRules(msgArray) {
        const isValid = createRule(v => {
            try {
                const cleaned = cleanString(v);
                if (!cleaned)
                    return false;
                const date = new Date(`${cleaned}T00:00:00Z`);
                return !isNaN(date.getTime());
            }
            catch {
                return false;
            }
        }, msgArray[1]);
        return [
            rules.regex(/^\d{4}-\d{2}-\d{2}$/, msgArray[0]),
            isValid
        ];
    }
    return {
        rules,
        ibanRules,
        isinRules,
        swiftRules,
        isoDateRules,
        nameRules: (msgArray) => [
            rules.required(msgArray[0]),
            rules.stringLength(2, 32, msgArray[1]),
            rules.regex(/^\p{L}/u, msgArray[2])
        ],
        amountRules: (zeroValue, msgArray) => [
            rules.oneOfTwo(zeroValue, msgArray[0])
        ],
        bookingTypeRules: (msgArray) => [
            rules.required(msgArray[0])
        ]
    };
}
