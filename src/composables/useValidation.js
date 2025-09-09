export const useValidation = () => {
    const valIbanRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length < 13) || msgArray[1],
            (v) => v.match(/^(^[A-Z]{2}[0-9]{3,12})/g) !== null || msgArray[2]
        ];
    };
    const valNameRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length < 32) || msgArray[1],
            (v) => v.match(/[^a-zA-Z\-äöüÄÖÜ]/g) === null || msgArray[2]
        ];
    };
    const valSwiftRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length < 13) || msgArray[1],
            (v) => v.match(/[^a-zA-Z0-9]/g) === null || msgArray[2]
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
    const valBrandNameRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0]
        ];
    };
    const requiredSelect = (msgArray) => {
        return [
            (v) => v > 0 || msgArray[0]
        ];
    };
    return {
        valIbanRules,
        valNameRules,
        valSwiftRules,
        valDateRules,
        valCurrencyCodeRules,
        valRequiredRules,
        valPositiveIntegerRules,
        valBrandNameRules,
        requiredSelect
    };
};
