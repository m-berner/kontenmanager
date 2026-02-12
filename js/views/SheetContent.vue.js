import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { DomainUtils } from "@/domains/utils";
import ContentCard from "@/components/ContentCard.vue";
import { ROUTES } from "@/configs/routes";
import { createPrivacyContent } from "@/configs/views";
const { t } = useI18n();
const router = useRouter();
const PARAGRAPHS = computed(() => createPrivacyContent(t));
const formatData = computed(() => {
    if (router.currentRoute.value.path !== ROUTES.PRIVACY)
        return undefined;
    return PARAGRAPHS.value.map((p) => ({
        subTitle: p.SUBTITLE,
        content: p.CONTENT,
        icon: p.ICON
    }));
});
DomainUtils.log("VIEWS SheetContent: setup");
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vSheet;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "sheet" },
    color: "surface-light",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "sheet" },
    color: "surface-light",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
;
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
vContainer;
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
if (__VLS_ctx.formatData) {
    const __VLS_13 = ContentCard;
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        data: (__VLS_ctx.formatData),
        title: (__VLS_ctx.t('views.sheetContent.privacyContent.general.title')),
    }));
    const __VLS_15 = __VLS_14({
        data: (__VLS_ctx.formatData),
        title: (__VLS_ctx.t('views.sheetContent.privacyContent.general.title')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
}
[formatData, formatData, t,];
var __VLS_10;
[];
var __VLS_3;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
