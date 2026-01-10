import { createApp } from 'vue';
import { useApp } from '@/composables/useApp';
import vuetifyPlugin from '@/plugins/vuetify';
import i18nPlugin from '@/plugins/i18n';
import piniaPlugin from '@/plugins/pinia';
import OptionsIndex from '@/screens/OptionsIndex.vue';
const { log } = useApp();
const op = createApp(OptionsIndex);
op.config.errorHandler = (err) => {
    log('PAGE_SCRIPTS options.js', err, 'error');
};
op.config.warnHandler = (msg) => {
    log('PAGE_SCRIPTS options.js', msg, 'warn');
};
op.use(vuetifyPlugin.vuetify);
op.use(i18nPlugin.i18n);
op.use(piniaPlugin.pinia);
op.mount('#options');
log('--- PAGE_SCRIPT options.js ---', window.location.href, 'info');
