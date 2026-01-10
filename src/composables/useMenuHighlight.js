import { computed, onUnmounted, ref } from 'vue';
export function useMenuHighlight() {
    const highlightedItems = ref(new Map());
    const timeouts = new Map();
    const highlight = (recordId, color = 'green') => {
        clearAllHighlights();
        highlightedItems.value.set(recordId, color);
    };
    const clearHighlight = (recordId) => {
        highlightedItems.value.delete(recordId);
        const timeout = timeouts.get(recordId);
        if (timeout) {
            clearTimeout(timeout);
            timeouts.delete(recordId);
        }
    };
    const clearAllHighlights = () => {
        highlightedItems.value.clear();
        for (const timeout of timeouts.values()) {
            clearTimeout(timeout);
        }
        timeouts.clear();
    };
    const highlightTemporary = (recordId, duration = 3000, color = 'green') => {
        highlight(recordId, color);
        const existingTimeout = timeouts.get(recordId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        const timeout = setTimeout(() => {
            clearHighlight(recordId);
        }, duration);
        timeouts.set(recordId, timeout);
    };
    onUnmounted(() => {
        clearAllHighlights();
    });
    return {
        highlightedItems: computed(() => highlightedItems.value),
        highlight,
        clearHighlight,
        clearAllHighlights,
        highlightTemporary
    };
}
