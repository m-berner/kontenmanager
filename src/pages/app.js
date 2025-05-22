import { createApp } from 'vue';
import AppIndex from '@/pages/AppIndex.vue';
import vuetifyPlugin from '@/plugins/vuetify';
import i18nPlugin from '@/plugins/i18n';
import componentsPlugin from '@/plugins/components';
import routerPlugin from '@/plugins/router';
import piniaPlugin from '@/plugins/pinia';
import { useApp } from '@/pages/background';
export const messagePort = browser.runtime.connect({ name: 'messagePort' });
const app = createApp(AppIndex);
app.config.errorHandler = (err) => {
    console.error(err);
};
app.config.warnHandler = (msg) => {
    console.warn(msg);
};
app.use(componentsPlugin);
app.use(vuetifyPlugin.vuetify);
app.use(i18nPlugin.i18n);
app.use(piniaPlugin.pinia);
app.use(routerPlugin.router);
app.mount('#app');
const { log } = useApp();
log('--- PAGE_SCRIPT app.js ---');
