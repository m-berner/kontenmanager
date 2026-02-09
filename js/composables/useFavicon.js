import { computed, ref } from "vue";
import { DomainUtils } from "@/domains/utils";
export function useFavicon(domain, size = 48) {
    const error = ref(false);
    const loading = ref(true);
    const retryCount = ref(0);
    const MAX_RETRIES = 2;
    const faviconUrl = computed(() => {
        if (domain.value.length <= 4)
            return "";
        if (retryCount.value === 0) {
            return `https://www.google.com/s2/favicons?domain=${domain.value}&sz=${size}`;
        }
        else if (retryCount.value === 1) {
            return `https://icons.duckduckgo.com/ip3/${domain.value}.ico`;
        }
        else {
            return `https://www.google.com/s2/favicons?domain=${domain.value}&sz=16`;
        }
    });
    function onLoad() {
        loading.value = false;
        error.value = false;
    }
    function onError() {
        if (retryCount.value < MAX_RETRIES) {
            retryCount.value++;
            loading.value = true;
        }
        else {
            error.value = true;
            loading.value = false;
        }
    }
    function reset() {
        error.value = false;
        loading.value = true;
        retryCount.value = 0;
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
DomainUtils.log("COMPOSABLE useFavicon");
