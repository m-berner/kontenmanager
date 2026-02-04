import { createApp } from "vue";
import { DomainUtils } from "@/domains/utils";
import vuetifyPlugin from "@/plugins/vuetify";
import i18nPlugin from "@/plugins/i18n";
import componentsPlugin from "@/plugins/components";
import routerPlugin from "@/plugins/router";
import piniaPlugin from "@/plugins/pinia";
import AppIndex from "@/views/AppIndex.vue";
import { useBrowser } from "@/composables/useBrowser";
const { manifest } = useBrowser();
window.addEventListener("unhandledrejection", (e) => {
    DomainUtils.log("APP: unhandledrejection", { reason: e.reason }, "error");
});
const app = createApp(AppIndex);
app.config.errorHandler = (err, _instance, info) => {
    const message = err instanceof Error ? err.message : String(err);
    DomainUtils.log("APP: errorHandler", { message, info, stack: err?.stack }, "error");
};
app.config.warnHandler = (msg, _instance, trace) => {
    DomainUtils.log("APP: warnHandler", { msg, trace }, "warn");
};
app.use(piniaPlugin.pinia);
app.use(i18nPlugin.i18n);
app.use(routerPlugin.router);
app.use(vuetifyPlugin.vuetify);
app.use(componentsPlugin);
app.mount("#app");
DomainUtils.log("--- entrypoints/app ---", { version: manifest.value.version, mode: import.meta.env.MODE }, "info");
