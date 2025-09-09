import { createApp } from 'vue';
import { useApp } from '@/composables/useApp';
import vuetifyPlugin from '@/plugins/vuetify';
import i18nPlugin from '@/plugins/i18n';
import OptionsIndex from '@/components/OptionsIndex.vue';
const { log } = useApp();
const op = createApp(OptionsIndex);
op.config.errorHandler = (err) => {
    log('PAGE_SCRIPTS options.js', { error: err });
};
op.config.warnHandler = (msg) => {
    log('PAGE_SCRIPTS options.js', { warn: msg });
};
op.use(vuetifyPlugin.vuetify);
op.use(i18nPlugin.i18n);
op.mount('#options');
log('--- PAGE_SCRIPT options.js ---', { info: window.location.href });
