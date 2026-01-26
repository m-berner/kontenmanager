import { createApp } from 'vue';
import { UtilsService } from '@/domain/utils';
import vuetifyPlugin from '@/plugins/vuetify';
import i18nPlugin from '@/plugins/i18n';
import componentsPlugin from '@/plugins/components';
import routerPlugin from '@/plugins/router';
import piniaPlugin from '@/plugins/pinia';
import AppIndex from '@/screens/AppIndex.vue';
const app = createApp(AppIndex);
app.config.errorHandler = (err, _instance, info) => {
    UtilsService.log('APP: errorHandler', { err, info }, 'error');
};
app.config.warnHandler = (msg, _instance, trace) => {
    UtilsService.log('APP: warnHandler', { msg, trace }, 'warn');
};
app.use(vuetifyPlugin.vuetify);
app.use(componentsPlugin);
app.use(i18nPlugin.i18n);
app.use(piniaPlugin.pinia);
app.use(routerPlugin.router);
app.mount('#app');
UtilsService.log('--- pages/app.js ---');
