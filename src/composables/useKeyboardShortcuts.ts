import {onMounted, onUnmounted, ref} from 'vue'

export const useKeyboardShortcuts = () => {
    const shortcuts = ref<Map<string, () => void>>(new Map())
    const activeKeys = ref<Set<string>>(new Set())

    const handleKeyDown = (ev: KeyboardEvent) => {
        activeKeys.value.add(ev.key)

        // Check for key combinations
        const combination = Array.from(activeKeys.value).sort().join('+')
        const handler = shortcuts.value.get(combination)
        if (handler) {
            handler()
        }
    }

    const handleKeyUp = (ev: KeyboardEvent) => {
        activeKeys.value.delete(ev.key)
    }

    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
    })

    return {shortcuts}
}
