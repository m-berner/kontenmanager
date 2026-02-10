import { useI18n } from "vue-i18n";
import { DomainUtils } from "@/domains/utils";
import { ROUTES } from "@/config/routes";
import { DEFAULTS } from "@/config/defaults";
const { t } = useI18n();
DomainUtils.log("VIEWS FooterBar: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VBottomNavigation;
;
VBottomNavigation;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    color: "primary",
}));
const __VLS_2 = __VLS_1({
    color: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
const __VLS_6 = {}.VBtn;
;
VBtn;
const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
    color: "white",
    to: (__VLS_ctx.ROUTES.HELP),
}));
const __VLS_8 = __VLS_7({
    color: "white",
    to: (__VLS_ctx.ROUTES.HELP),
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_10 } = __VLS_9.slots;
[ROUTES,];
const __VLS_11 = {}.VIcon;
;
VIcon;
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
    icon: "$help",
}));
const __VLS_13 = __VLS_12({
    icon: "$help",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({});
(__VLS_ctx.t("views.footerBar.help"));
[t,];
var __VLS_9;
const __VLS_16 = {}.VBtn;
;
VBtn;
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    color: "white",
    to: (__VLS_ctx.ROUTES.PRIVACY),
}));
const __VLS_18 = __VLS_17({
    color: "white",
    to: (__VLS_ctx.ROUTES.PRIVACY),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const { default: __VLS_20 } = __VLS_19.slots;
[ROUTES,];
const __VLS_21 = {}.VIcon;
;
VIcon;
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    icon: "$privacy",
}));
const __VLS_23 = __VLS_22({
    icon: "$privacy",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({});
(__VLS_ctx.t("views.footerBar.privacy"));
[t,];
var __VLS_19;
const __VLS_26 = {}.VBtn;
;
VBtn;
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    href: (__VLS_ctx.DEFAULTS.MAILTO),
    color: "white",
}));
const __VLS_28 = __VLS_27({
    href: (__VLS_ctx.DEFAULTS.MAILTO),
    color: "white",
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
const { default: __VLS_30 } = __VLS_29.slots;
[DEFAULTS,];
const __VLS_31 = {}.VIcon;
;
VIcon;
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    icon: "$mail",
}));
const __VLS_33 = __VLS_32({
    icon: "$mail",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({});
(__VLS_ctx.t("views.footerBar.mail"));
[t,];
var __VLS_29;
const __VLS_36 = {}.VBtn;
;
VBtn;
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    disabled: (true),
    color: "white",
}));
const __VLS_38 = __VLS_37({
    disabled: (true),
    color: "white",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const { default: __VLS_40 } = __VLS_39.slots;
const __VLS_41 = {}.VIcon;
;
VIcon;
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    icon: "$mdiCopyright",
}));
const __VLS_43 = __VLS_42({
    icon: "$mdiCopyright",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "nowrap" },
});
(__VLS_ctx.DEFAULTS.COPYRIGHT);
[DEFAULTS,];
var __VLS_39;
var __VLS_3;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ROUTES: ROUTES,
            DEFAULTS: DEFAULTS,
            t: t,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
