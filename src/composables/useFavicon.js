import {computed, ref} from 'vue';

export function useFavicon(domain, size = 48) {
    const error = ref(false);
    const loading = ref(true);
    const faviconUrl = computed(() => {
        if (domain.value.length > 4) {
            if (error.value) {
                return `https://icons.duckduckgo.com/ip3/${domain.value}.ico`;
            }
            return `https://www.google.com/s2/favicons?domain=${domain.value}&sz=${size}`;
        }
        return '';
    });

    function onLoad() {
        loading.value = false;
    }

    function onError() {
        if (!error.value) {
            error.value = true;
            loading.value = false;
        }
    }

    function reset() {
        error.value = false;
        loading.value = true;
    }

    return {
        faviconUrl,
        loading,
        error,
        onLoad,
        onError,
        reset
    };
}
