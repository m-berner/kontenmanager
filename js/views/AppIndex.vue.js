import { onBeforeMount, ref } from "vue";
import { RouterView } from "vue-router";
import { useI18n } from "vue-i18n";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import AlertOverlay from "@/components/AlertOverlay.vue";
import { initializeApp } from "@/services/app";
import { useTheme } from "vuetify";
import { useSettingsStore } from "@/stores/settings";
import { storeToRefs } from "pinia";
const { t } = useI18n();
const settings = useSettingsStore();
const { skin } = storeToRefs(settings);
const theme = useTheme();
const isInitialized = ref(false);
onBeforeMount(async () => {
    DomainUtils.log("VIEWS APP_INDEX: onBeforeMount");
    try {
        const controller = new AbortController();
        const status = await initializeApp({
            title: t("mixed.smImportOnly.title"),
            message: t("mixed.smImportOnly.message")
        }, controller.signal);
        DomainUtils.log("VIEWS APP_INDEX: Initialization successful", status, "info");
        controller.abort();
        theme.global.name.value = skin.value;
        isInitialized.value = true;
    }
    catch {
        throw new AppError(ERROR_CODES.VIEWS.APP_INDEX.A, ERROR_CATEGORY.VALIDATION, true);
    }
});
DomainUtils.log("VIEWS AppIndex: setup", window.location.href, "info");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VApp;
;
VApp;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    flat: (true),
}));
const __VLS_2 = __VLS_1({
    flat: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
if (__VLS_ctx.isInitialized) {
    [isInitialized,];
    const __VLS_6 = {}.RouterView;
    ;
    RouterView;
    const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
        name: "title",
    }));
    const __VLS_8 = __VLS_7({
        name: "title",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    const __VLS_11 = {}.RouterView;
    ;
    RouterView;
    const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
        name: "header",
    }));
    const __VLS_13 = __VLS_12({
        name: "header",
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    const __VLS_16 = {}.RouterView;
    ;
    RouterView;
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        name: "info",
    }));
    const __VLS_18 = __VLS_17({
        name: "info",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    const __VLS_21 = {}.VMain;
    ;
    VMain;
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({}));
    const __VLS_23 = __VLS_22({}, ...__VLS_functionalComponentArgsRest(__VLS_22));
    const { default: __VLS_25 } = __VLS_24.slots;
    const __VLS_26 = {}.RouterView;
    ;
    RouterView;
    const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({}));
    const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
    var __VLS_24;
    const __VLS_31 = {}.RouterView;
    ;
    RouterView;
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
        name: "footer",
    }));
    const __VLS_33 = __VLS_32({
        name: "footer",
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
}
else {
    const __VLS_36 = {}.VMain;
    ;
    VMain;
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({}));
    const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
    const { default: __VLS_40 } = __VLS_39.slots;
    const __VLS_41 = {}.VContainer;
    ;
    VContainer;
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        ...{ class: "d-flex align-center justify-center" },
        ...{ style: {} },
    }));
    const __VLS_43 = __VLS_42({
        ...{ class: "d-flex align-center justify-center" },
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    const { default: __VLS_45 } = __VLS_44.slots;
    const __VLS_46 = {}.VProgressCircular;
    ;
    VProgressCircular;
    const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({
        color: "primary",
        indeterminate: true,
        size: "64",
    }));
    const __VLS_48 = __VLS_47({
        color: "primary",
        indeterminate: true,
        size: "64",
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    var __VLS_44;
    var __VLS_39;
}
;
const __VLS_51 = __VLS_asFunctionalComponent(AlertOverlay, new AlertOverlay({}));
const __VLS_52 = __VLS_51({}, ...__VLS_functionalComponentArgsRest(__VLS_51));
var __VLS_3;
;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RouterView: RouterView,
            AlertOverlay: AlertOverlay,
            isInitialized: isInitialized,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
