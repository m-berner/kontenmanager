import { createPinia } from 'pinia';
import { useApp } from '@/pages/background';
const { log } = useApp();
const piniaConfig = {
    pinia: createPinia()
};
export default piniaConfig;
log('--- PLUGINS pinia.js ---');
