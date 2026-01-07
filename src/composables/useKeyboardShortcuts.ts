import {onMounted, onUnmounted, ref} from 'vue'

export const useKeyboardShortcuts = () => {
    const shortcuts = ref<Map<string, () => void>>(new Map())

    const handleKeyDown = (ev: KeyboardEvent) => {
        // Build modifier combination
        const modifiers = []
        if (ev.ctrlKey) modifiers.push('Ctrl')
        if (ev.altKey) modifiers.push('Alt')
        if (ev.shiftKey) modifiers.push('Shift')
        if (ev.metaKey) modifiers.push('Meta')

        // Add the actual key (normalized)
        const key = ev.key.length === 1 ? ev.key.toUpperCase() : ev.key
        const combination = [...modifiers, key].join('+')

        const handler = shortcuts.value.get(combination)
        if (handler) {
            ev.preventDefault()
            handler()
        }
    }

    const register = (combination: string, handler: () => void) => {
        shortcuts.value.set(combination, handler)
    }

    const unregister = (combination: string) => {
        shortcuts.value.delete(combination)
    }

    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown)
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown)
    })

    return {register, shortcuts, unregister}
}
