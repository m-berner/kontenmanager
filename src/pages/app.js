import { createApp } from 'vue';
import { useApp } from '@/composables/useApp';
import { useIndexedDB } from '@/composables/useIndexedDB';
import { useBrowser } from '@/composables/useBrowser';
import vuetifyPlugin from '@/plugins/vuetify';
import i18nPlugin from '@/plugins/i18n';
import componentsPlugin from '@/plugins/components';
import routerPlugin from '@/plugins/router';
import piniaPlugin from '@/plugins/pinia';
import AppIndex from '@/components/AppIndex.vue';
const { CONS, log } = useApp();
const { getDB } = useIndexedDB();
const { clearStorage, installStorageLocal } = useBrowser();
const db = await getDB();
const app = createApp(AppIndex);
app.config.errorHandler = (err) => {
    log('APP: errorHandler', { error: err });
};
app.config.warnHandler = (msg) => {
    log('APP: warnHandler', { warn: msg });
};
app.use(componentsPlugin);
app.use(vuetifyPlugin.vuetify);
app.use(i18nPlugin.i18n);
app.use(piniaPlugin.pinia);
app.use(routerPlugin.router);
app.mount('#app');
const keyStrokeController = [];
const onBeforeUnload = () => {
    log('APP: onBeforeUnload');
    db.close();
};
const onKeyDown = async (ev) => {
    keyStrokeController.push(ev.key);
    log('APP: onKeyDown');
    if (keyStrokeController.includes('Control') &&
        keyStrokeController.includes('Alt') &&
        ev.key === 'r') {
        await clearStorage();
        await installStorageLocal();
    }
    if (keyStrokeController.includes('Control') &&
        keyStrokeController.includes('Alt') &&
        ev.key === 'd' && Number.parseInt(localStorage.getItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG) ?? '0') > 0) {
        localStorage.setItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG, '0');
    }
    if (keyStrokeController.includes('Control') &&
        keyStrokeController.includes('Alt') &&
        ev.key === 'd' && !(Number.parseInt(localStorage.getItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG) ?? '0') > 0)) {
        localStorage.setItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG, '1');
    }
};
const onKeyUp = (ev) => {
    keyStrokeController.splice(keyStrokeController.indexOf(ev.key), 1);
};
window.addEventListener('keydown', onKeyDown, false);
window.addEventListener('keyup', onKeyUp, false);
window.addEventListener('beforeunload', onBeforeUnload, CONS.SYSTEM.ONCE);
log('--- PAGE_SCRIPT app.js ---');
