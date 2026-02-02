import { createApp } from "vue";
import { DomainUtils } from "@/domains/utils";
import vuetifyPlugin from "@/plugins/vuetify";
import i18nPlugin from "@/plugins/i18n";
import piniaPlugin from "@/plugins/pinia";
import OptionsIndex from "@/views/OptionsIndex.vue";
const app = createApp(OptionsIndex);
app.config.errorHandler = (err, _instance, info) => {
    const message = err instanceof Error ? err.message : String(err);
    DomainUtils.log("PAGE_SCRIPTS options.js", { message, info, stack: err?.stack }, "error");
};
app.config.warnHandler = (msg, _instance, trace) => {
    DomainUtils.log("PAGE_SCRIPTS options.js", { msg, trace }, "warn");
};
app.use(vuetifyPlugin.vuetify);
app.use(i18nPlugin.i18n);
app.use(piniaPlugin.pinia);
app.mount("#options");
DomainUtils.log("--- entrypoints/options.js ---", window.location.href, "info");
