import { computed, onMounted, onUnmounted, ref } from "vue";
export function useKeyboardShortcuts() {
    const shortcuts = ref(new Map());
    const enabled = ref(true);
    const handleKeyDown = (ev) => {
        if (!enabled.value)
            return;
        const modifiers = [];
        if (ev.ctrlKey)
            modifiers.push("Ctrl");
        if (ev.altKey)
            modifiers.push("Alt");
        if (ev.shiftKey)
            modifiers.push("Shift");
        if (ev.metaKey)
            modifiers.push("Meta");
        const key = ev.key.length === 1 ? ev.key.toUpperCase() : ev.key;
        const combination = [...modifiers, key].join("+");
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
    const clear = () => {
        shortcuts.value.clear();
    };
    const disable = () => {
        enabled.value = false;
    };
    const enable = () => {
        enabled.value = true;
    };
    onMounted(() => {
        window.addEventListener("keydown", handleKeyDown);
    });
    onUnmounted(() => {
        window.removeEventListener("keydown", handleKeyDown);
    });
    return {
        register,
        unregister,
        clear,
        disable,
        enable,
        shortcuts: computed(() => Array.from(shortcuts.value.keys())),
        enabled
    };
}
