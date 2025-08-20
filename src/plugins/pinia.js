import { createPinia } from 'pinia';
import { useApp } from '@/composables/useApp';
const { log } = useApp();
const piniaConfig = {
    pinia: createPinia()
};
export default piniaConfig;
log('--- PLUGINS pinia.js ---');
