import { useRecordsStore } from '@/stores/records';
function createRule(validator, message) {
    return (value) => validator(value) || message;
}
function required(message) {
    return createRule((v) => v !== null && v !== '' && v !== undefined, message);
}
function stringLength(min, max, message) {
    return createRule((v) => {
        const tv = v;
        const clean = tv.replace(/\s/g, '');
        return clean.length >= min && clean.length <= max;
    }, message);
}
function regex(pattern, message) {
    return createRule((v) => {
        const tv = v;
        const ttv = tv.replace(/\s/g, '');
        return pattern.test(ttv);
    }, message);
}
function oneOfTwo(zeroValue, message) {
    return createRule(v => {
        const tv = v;
        const zero = typeof zeroValue === 'number' ? zeroValue : zeroValue.value;
        if (tv > 0 && zero > 0) {
            return false;
        }
        else if (tv < 0) {
            return false;
        }
        return true;
    }, message);
}
export function useValidation() {
    function ibanRules(msgArray) {
        const ibanLength = (message) => {
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
            return createRule(v => {
                const tv = v;
                const iban = tv.replace(/\s/g, '');
                const countryCode = iban.substring(0, 2);
                return iban.length == ibanLengths[countryCode];
            }, message);
        };
        const createLuhnValidator = (message) => {
            return createRule(v => {
                const tv = v;
                const rearranged = tv.replace(/\s/g, '').substring(4) + tv.replace(/\s/g, '').substring(0, 4);
                const numericString = rearranged.replace(/[A-Z]/g, (char) => {
                    return (char.charCodeAt(0) - 55).toString();
                });
                const remainder = BigInt(numericString) % 97n;
                return remainder === 1n;
            }, message);
        };
        const isDuplicate = (message) => {
            return createRule(v => {
                const tv = v;
                const records = useRecordsStore();
                return !records.accounts.isDuplicate(tv.replace(/\s/g, ''));
            }, message);
        };
        return [
            required(msgArray[0]),
            ibanLength(msgArray[1]),
            regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, msgArray[2]),
            createLuhnValidator(msgArray[3]),
            isDuplicate(msgArray[4])
        ];
    }
    function nameRules(msgArray) {
        return [
            required(msgArray[0]),
            stringLength(2, 32, msgArray[1]),
            regex(/^[a-zA-ZäöüÄÖÜ].*/g, msgArray[2])
        ];
    }
    function bookingTypeRules(msgArray) {
        return [
            required(msgArray[0])
        ];
    }
    function swiftRules(msgArray) {
        const swiftLength = (message) => {
            return createRule(v => {
                const tv = v;
                const inLength = tv.replace(/\s/g, '').length;
                return inLength === 8 || inLength === 11;
            }, message);
        };
        const branchCode = (message) => {
            return createRule(v => {
                const tv = v;
                const branchCode = tv.replace(/\s/g, '').length === 11 ? tv.replace(/\s/g, '').substring(8, 11) : '';
                return /^[A-Z0-9]{3}$/.test(branchCode);
            }, message);
        };
        const subRegex = (start, end, pattern, message) => {
            return createRule((v) => {
                const tv = v;
                const ttv = tv.replace(/\s/g, '').substring(start, end);
                return pattern.test(ttv);
            }, message);
        };
        const startsWith = (start, end, message) => {
            return createRule((v) => {
                const tv = v;
                const ttv = tv.replace(/\s/g, '').substring(start, end);
                return !ttv.startsWith('0');
            }, message);
        };
        return [
            required(msgArray[0]),
            swiftLength(msgArray[1]),
            regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, msgArray[2]),
            subRegex(0, 4, /^[A-Z]{4}$/, msgArray[3]),
            subRegex(4, 6, /^[A-Z]{2}$/, msgArray[4]),
            subRegex(6, 8, /^[A-Z0-9]{2}$/, msgArray[5]),
            branchCode(msgArray[6]),
            startsWith(6, 8, msgArray[7])
        ];
    }
    function isoDateRules(msgArray) {
        const isValid = (message) => {
            return createRule(v => {
                const tv = v;
                const date = new Date(`${tv}T00:00:00Z`);
                return isNaN(date.getTime());
            }, message);
        };
        return [
            regex(/^\d{4}-\d{2}-\d{2}$/, msgArray[0]),
            isValid(msgArray[1])
        ];
    }
    function creditRules(zeroValue, msgArray) {
        return [
            oneOfTwo(zeroValue, msgArray[0])
        ];
    }
    function debitRules(zeroValue, msgArray) {
        return [
            oneOfTwo(zeroValue, msgArray[0])
        ];
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
        const countryCode = (message) => {
            return createRule(v => {
                const tv = v;
                const clean = tv.replace(/\s/g, '').toUpperCase();
                const countryCode = clean.substring(0, 2);
                return validCountryCodes.includes(countryCode);
            }, message);
        };
        const checkSum = (message) => {
            return createRule(v => {
                const tv = v;
                const clean = tv.replace(/\s/g, '').toUpperCase();
                const digits = clean.substring(0, 11);
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
                const providedCheckDigit = parseInt(clean[11]);
                return checkDigit === providedCheckDigit;
            }, message);
        };
        return [
            required(msgArray[0]),
            stringLength(12, 12, msgArray[1]),
            regex(/^[A-z]{2}[A-z0-9]{9}[0-9]$/, msgArray[2]),
            countryCode(msgArray[3]),
            checkSum(msgArray[4])
        ];
    }
    return {
        ibanRules,
        isinRules,
        creditRules,
        debitRules,
        nameRules,
        swiftRules,
        isoDateRules,
        bookingTypeRules
    };
}
