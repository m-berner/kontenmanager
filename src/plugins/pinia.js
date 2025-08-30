import { createPinia } from 'pinia';
import { useNotification } from '@/composables/useNotification';
const { log } = useNotification();
const piniaConfig = {
    pinia: createPinia()
};
export default piniaConfig;
log('--- PLUGINS pinia.js ---');
