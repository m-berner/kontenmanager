export function useDebounce(func, delay) {
    let timeoutId;
    const debouncedFunction = (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
    const cancel = () => {
        clearTimeout(timeoutId);
    };
    return { debouncedFunction, cancel };
}
