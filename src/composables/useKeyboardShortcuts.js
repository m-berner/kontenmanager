import { onMounted, onUnmounted, ref } from 'vue';
export const useKeyboardShortcuts = () => {
    const shortcuts = ref(new Map());
    const activeKeys = ref(new Set());
    const handleKeyDown = (ev) => {
        activeKeys.value.add(ev.key);
        const combination = Array.from(activeKeys.value).sort().join('+');
        const handler = shortcuts.value.get(combination);
        if (handler) {
            handler();
        }
    };
    const handleKeyUp = (ev) => {
        activeKeys.value.delete(ev.key);
    };
    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    });
    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    });
    return { shortcuts };
};
