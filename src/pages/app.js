import { createApp } from 'vue';
import AppIndex from '@/components/AppIndex.vue';
import vuetifyPlugin from '@/plugins/vuetify';
import i18nPlugin from '@/plugins/i18n';
import componentsPlugin from '@/plugins/components';
import routerPlugin from '@/plugins/router';
import piniaPlugin from '@/plugins/pinia';
import { useApp } from '@/apis/useApp';
import { useDatabase } from '@/apis/useDatabase';
const { CONS, log } = useApp();
const { open, dbi } = useDatabase();
await open();
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
const keyStrokeController = [];
const onBeforeUnload = () => {
    log('BACKGROUND: onBeforeUnload');
    dbi()?.close();
};
const onKeyDown = async (ev) => {
    keyStrokeController.push(ev.key);
    log('BACKGROUND: onKeyDown');
    if (keyStrokeController.includes('Control') &&
        keyStrokeController.includes('Alt') &&
        ev.key === 'r') {
        await browser.storage.local.clear();
    }
    if (keyStrokeController.includes('Control') &&
        keyStrokeController.includes('Alt') &&
        ev.key === 'd' && Number.parseInt(localStorage.getItem(CONS.STORAGE.PROPS.DEBUG) ?? '0') > 0) {
        localStorage.setItem(CONS.STORAGE.PROPS.DEBUG, '0');
    }
    if (keyStrokeController.includes('Control') &&
        keyStrokeController.includes('Alt') &&
        ev.key === 'd' && !(Number.parseInt(localStorage.getItem(CONS.STORAGE.PROPS.DEBUG) ?? '0') > 0)) {
        localStorage.setItem(CONS.STORAGE.PROPS.DEBUG, '1');
    }
};
const onKeyUp = (ev) => {
    keyStrokeController.splice(keyStrokeController.indexOf(ev.key), 1);
};
window.addEventListener('keydown', onKeyDown, false);
window.addEventListener('keyup', onKeyUp, false);
window.addEventListener('beforeunload', onBeforeUnload, CONS.SYSTEM.ONCE);
log('--- PAGE_SCRIPT app.js ---');
