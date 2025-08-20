import OptionsIndex from '@/components/OptionsIndex.vue';
import { createApp } from 'vue';
import vuetifyPlugin from '@/plugins/vuetify';
import i18nPlugin from '@/plugins/i18n';
import { useApp } from '@/composables/useApp';
const { log } = useApp();
const op = createApp(OptionsIndex);
op.config.errorHandler = (err) => {
    console.error(err);
};
op.config.warnHandler = (msg) => {
    console.warn(msg);
};
op.use(vuetifyPlugin.vuetify);
op.use(i18nPlugin.i18n);
op.mount('#options');
log('--- PAGE_SCRIPT options.js ---', { info: window.location.href });
