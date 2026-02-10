import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { DomainUtils } from "@/domains/utils";
import ContentCard from "@/components/ContentCard.vue";
import { ROUTES } from "@/config/routes";
import { createPrivacyContent } from "@/config/views";
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
DomainUtils.log("VIEW SheetContent: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VSheet;
;
VSheet;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "sheet" },
    color: "surface-light",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "sheet" },
    color: "surface-light",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
const __VLS_6 = {}.VContainer;
;
VContainer;
const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_10 } = __VLS_9.slots;
if (__VLS_ctx.formatData) {
    [formatData,];
    ;
    const __VLS_11 = __VLS_asFunctionalComponent(ContentCard, new ContentCard({
        data: (__VLS_ctx.formatData),
        title: (__VLS_ctx.t('views.sheetContent.privacyContent.general.title')),
    }));
    const __VLS_12 = __VLS_11({
        data: (__VLS_ctx.formatData),
        title: (__VLS_ctx.t('views.sheetContent.privacyContent.general.title')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    [formatData, t,];
}
var __VLS_9;
var __VLS_3;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ContentCard: ContentCard,
            t: t,
            formatData: formatData,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
