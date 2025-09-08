import {computed} from 'vue';

export const useDomain = (url) => {
    const domain = computed(() => {
        if (!url.value)
            return null;
        try {
            let processedUrl = url.value;
            if (!processedUrl.startsWith('http')) {
                processedUrl = `https://${processedUrl}`;
            }
            const urlObj = new URL(processedUrl);
            return urlObj.hostname.replace(/^www\./, '');
        } catch (error) {
            return null;
        }
    });
    const subdomain = computed(() => {
        if (!url.value)
            return null;
        try {
            const urlObj = new URL(url.value.startsWith('http') ? url.value : `https://${url.value}`);
            const parts = urlObj.hostname.split('.');
            if (parts.length > 2) {
                return parts[0] !== 'www' ? parts[0] : null;
            }
            return null;
        } catch (error) {
            console.error(error);
            return null;
        }
    });
    return {
        domain,
        subdomain
    };
};
