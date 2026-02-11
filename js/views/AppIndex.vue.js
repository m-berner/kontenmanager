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
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vApp;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    flat: (true),
}));
const __VLS_2 = __VLS_1({
    flat: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
if (__VLS_ctx.isInitialized) {
    let __VLS_7;
    RouterView;
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        name: "title",
    }));
    const __VLS_9 = __VLS_8({
        name: "title",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    RouterView;
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        name: "header",
    }));
    const __VLS_14 = __VLS_13({
        name: "header",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    let __VLS_17;
    RouterView;
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        name: "info",
    }));
    const __VLS_19 = __VLS_18({
        name: "info",
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    let __VLS_22;
    vMain;
    const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({}));
    const __VLS_24 = __VLS_23({}, ...__VLS_functionalComponentArgsRest(__VLS_23));
    const { default: __VLS_27 } = __VLS_25.slots;
    let __VLS_28;
    RouterView;
    const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({}));
    const __VLS_30 = __VLS_29({}, ...__VLS_functionalComponentArgsRest(__VLS_29));
    [isInitialized,];
    var __VLS_25;
    let __VLS_33;
    RouterView;
    const __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
        name: "footer",
    }));
    const __VLS_35 = __VLS_34({
        name: "footer",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
}
else {
    let __VLS_38;
    vMain;
    const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({}));
    const __VLS_40 = __VLS_39({}, ...__VLS_functionalComponentArgsRest(__VLS_39));
    const { default: __VLS_43 } = __VLS_41.slots;
    let __VLS_44;
    vContainer;
    const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        ...{ class: "d-flex align-center justify-center" },
        ...{ style: {} },
    }));
    const __VLS_46 = __VLS_45({
        ...{ class: "d-flex align-center justify-center" },
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    ;
    ;
    ;
    const { default: __VLS_49 } = __VLS_47.slots;
    let __VLS_50;
    vProgressCircular;
    const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        color: "primary",
        indeterminate: true,
        size: "64",
    }));
    const __VLS_52 = __VLS_51({
        color: "primary",
        indeterminate: true,
        size: "64",
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
    [];
    var __VLS_47;
    [];
    var __VLS_41;
}
const __VLS_55 = AlertOverlay;
const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({}));
const __VLS_57 = __VLS_56({}, ...__VLS_functionalComponentArgsRest(__VLS_56));
[];
var __VLS_3;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
