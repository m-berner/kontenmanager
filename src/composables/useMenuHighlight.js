import { onUnmounted, ref } from 'vue';
export function useMenuHighlight() {
    const highlightedItems = ref(new Map());
    const highlight = (recordId, color = 'green') => {
        highlightedItems.value.clear();
        highlightedItems.value.set(recordId, color);
    };
    const clearHighlight = (recordId) => {
        highlightedItems.value.delete(recordId);
    };
    const clearAllHighlights = () => {
        highlightedItems.value.clear();
    };
    let timeoutId = null;
    const highlightTemporary = (recordId, duration = 3000) => {
        highlight(recordId);
        if (timeoutId)
            clearTimeout(timeoutId);
        timeoutId = setTimeout(() => clearHighlight(recordId), duration);
    };
    onUnmounted(() => {
        if (timeoutId)
            clearTimeout(timeoutId);
    });
    return {
        highlightedItems,
        highlight,
        clearHighlight,
        clearAllHighlights,
        highlightTemporary
    };
}
