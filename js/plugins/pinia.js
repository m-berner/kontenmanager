import { createPinia } from 'pinia';
import { UtilsService } from '@/domains/utils';
const piniaConfig = {
    pinia: createPinia()
};
export default piniaConfig;
UtilsService.log('--- plugins/pinia.js ---');
