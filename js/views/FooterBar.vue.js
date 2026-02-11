import { useI18n } from "vue-i18n";
import { DomainUtils } from "@/domains/utils";
import { ROUTES } from "@/config/routes";
import { DEFAULTS } from "@/config/defaults";
const { t } = useI18n();
DomainUtils.log("VIEWS FooterBar: setup");
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vBottomNavigation;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    color: "primary",
}));
const __VLS_2 = __VLS_1({
    color: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
vBtn;
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    color: "white",
    to: (__VLS_ctx.ROUTES.HELP),
}));
const __VLS_9 = __VLS_8({
    color: "white",
    to: (__VLS_ctx.ROUTES.HELP),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
let __VLS_13;
vIcon;
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    icon: "$help",
}));
const __VLS_15 = __VLS_14({
    icon: "$help",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
(__VLS_ctx.t("views.footerBar.help"));
[ROUTES, t,];
var __VLS_10;
let __VLS_18;
vBtn;
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    color: "white",
    to: (__VLS_ctx.ROUTES.PRIVACY),
}));
const __VLS_20 = __VLS_19({
    color: "white",
    to: (__VLS_ctx.ROUTES.PRIVACY),
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
const { default: __VLS_23 } = __VLS_21.slots;
let __VLS_24;
vIcon;
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    icon: "$privacy",
}));
const __VLS_26 = __VLS_25({
    icon: "$privacy",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
(__VLS_ctx.t("views.footerBar.privacy"));
[ROUTES, t,];
var __VLS_21;
let __VLS_29;
vBtn;
const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
    href: (__VLS_ctx.DEFAULTS.MAILTO),
    color: "white",
}));
const __VLS_31 = __VLS_30({
    href: (__VLS_ctx.DEFAULTS.MAILTO),
    color: "white",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
const { default: __VLS_34 } = __VLS_32.slots;
let __VLS_35;
vIcon;
const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
    icon: "$mail",
}));
const __VLS_37 = __VLS_36({
    icon: "$mail",
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
(__VLS_ctx.t("views.footerBar.mail"));
[t, DEFAULTS,];
var __VLS_32;
let __VLS_40;
vBtn;
const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
    disabled: (true),
    color: "white",
}));
const __VLS_42 = __VLS_41({
    disabled: (true),
    color: "white",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const { default: __VLS_45 } = __VLS_43.slots;
let __VLS_46;
vIcon;
const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
    icon: "$mdiCopyright",
}));
const __VLS_48 = __VLS_47({
    icon: "$mdiCopyright",
}, ...__VLS_functionalComponentArgsRest(__VLS_47));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "nowrap" },
});
;
(__VLS_ctx.DEFAULTS.COPYRIGHT);
[DEFAULTS,];
var __VLS_43;
[];
var __VLS_3;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
