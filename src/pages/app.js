import { createApp } from 'vue';
import { useApp } from '@/composables/useApp';
import vuetifyPlugin from '@/plugins/vuetify';
import i18nPlugin from '@/plugins/i18n';
import componentsPlugin from '@/plugins/components';
import routerPlugin from '@/plugins/router';
import piniaPlugin from '@/plugins/pinia';
import AppIndex from '@/screens/AppIndex.vue';
const { log } = useApp();
const app = createApp(AppIndex);
app.config.errorHandler = (err) => {
    log('APP: errorHandler', err, 'error');
};
app.config.warnHandler = (msg) => {
    log('APP: warnHandler', msg, 'warn');
};
app.use(vuetifyPlugin.vuetify);
app.use(componentsPlugin);
app.use(i18nPlugin.i18n);
app.use(piniaPlugin.pinia);
app.use(routerPlugin.router);
app.mount('#app');
log('--- PAGE_SCRIPT app.js ---');
