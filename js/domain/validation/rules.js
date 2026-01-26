import { ValidationError } from './codes';
export class ValidationRules {
    static CHAR_CODE_OFFSET = 55;
    static MOD_97 = 97n;
    static LUHN_BASE = 10;
    static IBAN_LENGTHS = {
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
    static VALID_COUNTRY_CODES = new Set([
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
    static required(value) {
        if (value === null || value === undefined || value === '') {
            return { isValid: false, error: ValidationError.REQUIRED };
        }
        return { isValid: true };
    }
    static validateIBAN(iban) {
        const cleaned = iban.replace(/\s/g, '').toUpperCase();
        if (!cleaned)
            return { isValid: false, error: ValidationError.REQUIRED };
        const countryCode = cleaned.substring(0, 2);
        if (cleaned.length !== this.IBAN_LENGTHS[countryCode]) {
            return { isValid: false, error: ValidationError.INVALID_LENGTH };
        }
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleaned)) {
            return { isValid: false, error: ValidationError.INVALID_FORMAT };
        }
        const rearranged = cleaned.substring(4) + cleaned.substring(0, 4);
        const numericString = this.convertToNumericString(rearranged);
        const isValid = BigInt(numericString) % this.MOD_97 === 1n;
        return isValid ? { isValid: true } : { isValid: false, error: ValidationError.INVALID_CHECKSUM };
    }
    static validateISIN(isin) {
        const cleaned = isin.replace(/\s/g, '').toUpperCase();
        if (!cleaned)
            return { isValid: false, error: ValidationError.REQUIRED };
        if (cleaned.length !== 12)
            return { isValid: false, error: ValidationError.INVALID_LENGTH };
        if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(cleaned)) {
            return { isValid: false, error: ValidationError.INVALID_FORMAT };
        }
        const countryCode = cleaned.substring(0, 2);
        if (!this.VALID_COUNTRY_CODES.has(countryCode)) {
            return { isValid: false, error: ValidationError.INVALID_COUNTRY };
        }
        const digits = cleaned.substring(0, 11);
        const numericString = this.convertToNumericString(digits);
        const checkDigit = this.calculateLuhnCheckDigit(numericString, this.LUHN_BASE);
        const providedCheckDigit = parseInt(cleaned[11], 10);
        return checkDigit === providedCheckDigit
            ? { isValid: true }
            : { isValid: false, error: ValidationError.INVALID_CHECKSUM };
    }
    static validateSWIFT(swift) {
        const cleaned = swift.replace(/\s/g, '').toUpperCase();
        if (!cleaned)
            return { isValid: false, error: ValidationError.REQUIRED };
        if (cleaned.length !== 8 && cleaned.length !== 11) {
            return { isValid: false, error: ValidationError.INVALID_LENGTH };
        }
        if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned)) {
            return { isValid: false, error: ValidationError.INVALID_FORMAT };
        }
        const bankCode = cleaned.substring(0, 4);
        if (!/^[A-Z]{4}$/.test(bankCode))
            return { isValid: false, error: ValidationError.INVALID_BANK };
        const countryCode = cleaned.substring(4, 6);
        if (!this.VALID_COUNTRY_CODES.has(countryCode)) {
        }
        const locationCode = cleaned.substring(6, 8);
        if (!/^[A-Z0-9]{2}$/.test(locationCode))
            return { isValid: false, error: ValidationError.INVALID_REGION };
        if (cleaned.length === 11) {
            const branchCode = cleaned.substring(8, 11);
            if (!/^[A-Z0-9]{3}$/.test(branchCode))
                return { isValid: false, error: ValidationError.INVALID_BRANCH };
        }
        return { isValid: true };
    }
    static convertToNumericString(text) {
        return Array.from(text).map(char => {
            if (char >= 'A' && char <= 'Z') {
                return (char.charCodeAt(0) - this.CHAR_CODE_OFFSET).toString();
            }
            return char;
        }).join('');
    }
    static calculateLuhnCheckDigit(numericString, base) {
        let sum = 0;
        let shouldDouble = true;
        for (let i = numericString.length - 1; i >= 0; i--) {
            let digit = parseInt(numericString[i], 10);
            if (shouldDouble) {
                digit *= 2;
                if (digit >= base)
                    digit -= (base - 1);
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return (base - (sum % base)) % base;
    }
}
