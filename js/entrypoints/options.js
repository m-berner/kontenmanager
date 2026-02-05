import { createApp } from "vue";
import { DomainUtils } from "@/domains/utils";
import vuetifyPlugin from "@/plugins/vuetify";
import i18nPlugin from "@/plugins/i18n";
import piniaPlugin from "@/plugins/pinia";
import OptionsIndex from "@/views/OptionsIndex.vue";
window.addEventListener("unhandledrejection", (e) => {
    DomainUtils.log("ENTRYPOINTS OPTIONS: unhandledrejection", { reason: e.reason }, "error");
});
const app = createApp(OptionsIndex);
app.config.errorHandler = (err, _instance, info) => {
    const message = err instanceof Error ? err.message : String(err);
    DomainUtils.log("ENTRYPOINTS OPTIONS: errorHandler", { message, info, stack: err?.stack }, "error");
};
app.config.warnHandler = (msg, _instance, trace) => {
    DomainUtils.log("ENTRYPOINTS OPTIONS: warnHandler", { msg, trace }, "warn");
};
app.use(piniaPlugin.pinia);
app.use(i18nPlugin.i18n);
app.use(vuetifyPlugin.vuetify);
app.mount("#options");
DomainUtils.log("ENTRYPOINTS OPTIONS", window.location.href, "info");
