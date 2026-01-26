import { computed } from 'vue';
export function useDomain(url) {
    const domain = computed(() => {
        if (!url.value)
            return '';
        try {
            let processedUrl = url.value;
            if (!processedUrl.startsWith('http')) {
                processedUrl = `https://${processedUrl}`;
            }
            const urlObj = new URL(processedUrl);
            return urlObj.hostname.replace(/^www\./, '');
        }
        catch (e) {
            return '';
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
        }
        catch {
            return null;
        }
    });
    const protocol = computed(() => {
        if (!url.value)
            return null;
        try {
            const urlObj = new URL(url.value.startsWith('http') ? url.value : `https://${url.value}`);
            return urlObj.protocol.replace(':', '');
        }
        catch {
            return null;
        }
    });
    const pathname = computed(() => {
        if (!url.value)
            return null;
        try {
            const urlObj = new URL(url.value.startsWith('http') ? url.value : `https://${url.value}`);
            return urlObj.pathname;
        }
        catch {
            return null;
        }
    });
    return {
        domain,
        subdomain,
        protocol,
        pathname
    };
}
