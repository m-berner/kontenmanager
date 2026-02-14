import { DomainUtils } from "@/domains/utils";
import { VALIDATION_CODES } from "@/domains/validation/codes";
import { ValidationRules } from "@/domains/validation/rules";
class ValidationServiceImpl {
    createRule(validator, message) {
        return (value) => validator(value) || message;
    }
    cleanString(value) {
        if (typeof value !== "string")
            return null;
        return value.replace(/\s/g, "");
    }
    oneOfTwo(zeroValue, message) {
        return this.createRule((v) => {
            const tv = v;
            const zero = typeof zeroValue === "number" ? zeroValue : zeroValue.value;
            if (tv > 0 && zero > 0) {
                return false;
            }
            else if (tv < 0) {
                return false;
            }
            return true;
        }, message);
    }
    required(message) {
        return this.createRule((v) => v !== null && v !== "" && v !== undefined, message);
    }
    stringLength(min, max, message) {
        return this.createRule((v) => {
            const cleaned = this.cleanString(v);
            if (!cleaned)
                return false;
            return cleaned.length >= min && cleaned.length <= max;
        }, message);
    }
    regex(pattern, message) {
        return this.createRule((v) => {
            const cleaned = this.cleanString(v);
            if (!cleaned)
                return false;
            return pattern.test(cleaned);
        }, message);
    }
    nameRules(msgArray) {
        return [
            this.required(msgArray[0]),
            this.stringLength(2, 32, msgArray[1]),
            this.regex(/^[a-zA-ZäöüÄÖÜ].*/, msgArray[2])
        ];
    }
    bookingTypeRules(msgArray) {
        return [this.required(msgArray[0])];
    }
    amountRules(zeroValue, msgArray) {
        return [this.oneOfTwo(zeroValue, msgArray[0])];
    }
    validateIBAN(iban) {
        return ValidationRules.validateIBAN(iban).isValid;
    }
    isoDateRules(msgArray) {
        const isValid = (message) => {
            return this.createRule((v) => {
                const tv = v;
                const date = new Date(`${tv}T00:00:00Z`);
                return !isNaN(date.getTime());
            }, message);
        };
        return [
            this.regex(/^\d{4}-\d{2}-\d{2}$/, msgArray[0]),
            isValid(msgArray[1])
        ];
    }
    ibanRules(msgArray) {
        return [
            this.required(msgArray[0]),
            this.fromDomain((v) => ValidationRules.validateIBAN(v), {
                [VALIDATION_CODES.INVALID_LENGTH]: msgArray[1],
                [VALIDATION_CODES.INVALID_FORMAT]: msgArray[2],
                [VALIDATION_CODES.INVALID_CHECKSUM]: msgArray[3],
                [VALIDATION_CODES.REQUIRED]: msgArray[0]
            })
        ];
    }
    validateISIN(isin) {
        return ValidationRules.validateISIN(isin).isValid;
    }
    isinRules(msgArray) {
        return [
            this.required(msgArray[0]),
            this.fromDomain((v) => ValidationRules.validateISIN(v), {
                [VALIDATION_CODES.INVALID_LENGTH]: msgArray[1],
                [VALIDATION_CODES.INVALID_FORMAT]: msgArray[2],
                [VALIDATION_CODES.INVALID_COUNTRY]: msgArray[3],
                [VALIDATION_CODES.INVALID_CHECKSUM]: msgArray[4],
                [VALIDATION_CODES.REQUIRED]: msgArray[0]
            })
        ];
    }
    swiftRules(msgArray) {
        return [
            this.required(msgArray[0]),
            this.fromDomain((v) => ValidationRules.validateSWIFT(v), {
                [VALIDATION_CODES.INVALID_LENGTH]: msgArray[1],
                [VALIDATION_CODES.INVALID_FORMAT]: msgArray[2],
                [VALIDATION_CODES.INVALID_BANK]: msgArray[3],
                [VALIDATION_CODES.INVALID_COUNTRY]: msgArray[4],
                [VALIDATION_CODES.INVALID_REGION]: msgArray[5],
                [VALIDATION_CODES.INVALID_BRANCH]: msgArray[6],
                [VALIDATION_CODES.TEST_BIC]: msgArray[7],
                [VALIDATION_CODES.REQUIRED]: msgArray[0]
            })
        ];
    }
    fromDomain(domainFn, messageMap) {
        return (v) => {
            const res = domainFn(v);
            if (res.isValid)
                return true;
            return messageMap[res.error] || "Invalid";
        };
    }
}
export const validationService = new ValidationServiceImpl();
export { ValidationServiceImpl as ValidationService };
DomainUtils.log("SERVICES validation");
