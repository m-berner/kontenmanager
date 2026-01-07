import { onMounted, onUnmounted, ref } from 'vue';
export const useKeyboardShortcuts = () => {
    const shortcuts = ref(new Map());
    const handleKeyDown = (ev) => {
        const modifiers = [];
        if (ev.ctrlKey)
            modifiers.push('Ctrl');
        if (ev.altKey)
            modifiers.push('Alt');
        if (ev.shiftKey)
            modifiers.push('Shift');
        if (ev.metaKey)
            modifiers.push('Meta');
        const key = ev.key.length === 1 ? ev.key.toUpperCase() : ev.key;
        const combination = [...modifiers, key].join('+');
        const handler = shortcuts.value.get(combination);
        if (handler) {
            ev.preventDefault();
            handler();
        }
    };
    const register = (combination, handler) => {
        shortcuts.value.set(combination, handler);
    };
    const unregister = (combination) => {
        shortcuts.value.delete(combination);
    };
    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown);
    });
    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown);
    });
    return { register, shortcuts, unregister };
};
