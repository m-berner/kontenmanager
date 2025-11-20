import {computed, ref} from 'vue';

export function useFavicon(domain, size = 48) {
    const error = ref(false);
    const loading = ref(true);
    const faviconUrl = computed(() => {
        if (domain.length > 4) {
            if (error.value) {
                return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
            }
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
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
