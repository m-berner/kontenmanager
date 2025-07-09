import { createPinia } from 'pinia';
import { useAppApi } from '@/pages/background';
const { log } = useAppApi();
const piniaConfig = {
    pinia: createPinia()
};
export default piniaConfig;
log('--- PLUGINS pinia.js ---');
