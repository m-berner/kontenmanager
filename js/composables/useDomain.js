import { computed } from 'vue';
import { UtilsService } from '@/domains/utils';
import { serializeError } from '@/domains/errors';
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
            UtilsService.log('useDomain:domain', serializeError(e), 'error');
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
        catch (e) {
            UtilsService.log('useDomain:subdomain', serializeError(e), 'error');
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
        catch (e) {
            UtilsService.log('useDomain:protocol', serializeError(e), 'error');
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
        catch (e) {
            UtilsService.log('useDomain:pathname', serializeError(e), 'error');
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
