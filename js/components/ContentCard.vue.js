import { DomainUtils } from "@/domains/utils";
const props = defineProps();
DomainUtils.log("COMPONENTS ContentCard: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VRow;
;
VRow;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    justify: "center",
}));
const __VLS_2 = __VLS_1({
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
const __VLS_6 = {}.VCol;
;
VCol;
const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
    cols: "12",
}));
const __VLS_8 = __VLS_7({
    cols: "12",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_10 } = __VLS_9.slots;
const __VLS_11 = {}.VCard;
;
VCard;
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
    color: "secondary",
}));
const __VLS_13 = __VLS_12({
    color: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
const { default: __VLS_15 } = __VLS_14.slots;
const __VLS_16 = {}.VCardTitle;
;
VCardTitle;
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({}));
const __VLS_18 = __VLS_17({}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const { default: __VLS_20 } = __VLS_19.slots;
(props.title);
var __VLS_19;
var __VLS_14;
var __VLS_9;
for (const [item] of __VLS_getVForSourceType((props.data))) {
    const __VLS_21 = {}.VCol;
    ;
    VCol;
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
        key: (item.subTitle),
        cols: "12",
    }));
    const __VLS_23 = __VLS_22({
        key: (item.subTitle),
        cols: "12",
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    const { default: __VLS_25 } = __VLS_24.slots;
    const __VLS_26 = {}.VCard;
    ;
    VCard;
    const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({}));
    const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
    const { default: __VLS_30 } = __VLS_29.slots;
    const __VLS_31 = {}.VCardTitle;
    ;
    VCardTitle;
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
        ...{ class: "d-flex" },
    }));
    const __VLS_33 = __VLS_32({
        ...{ class: "d-flex" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    const { default: __VLS_35 } = __VLS_34.slots;
    if (item.icon !== '') {
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
        if (item.icon.substring(0, 1) === '$') {
            const __VLS_36 = {}.VIcon;
            ;
            VIcon;
            const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
                icon: (item.icon),
            }));
            const __VLS_38 = __VLS_37({
                icon: (item.icon),
            }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        }
        else {
            const __VLS_41 = {}.VImg;
            ;
            VImg;
            const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
                inline: (true),
                src: (item.icon),
                height: "32",
                width: "32",
            }));
            const __VLS_43 = __VLS_42({
                inline: (true),
                src: (item.icon),
                height: "32",
                width: "32",
            }, ...__VLS_functionalComponentArgsRest(__VLS_42));
        }
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
    }
    (item.subTitle);
    var __VLS_34;
    const __VLS_46 = {}.VCardText;
    ;
    VCardText;
    const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({}));
    const __VLS_48 = __VLS_47({}, ...__VLS_functionalComponentArgsRest(__VLS_47));
    const { default: __VLS_50 } = __VLS_49.slots;
    (item.content);
    var __VLS_49;
    var __VLS_29;
    var __VLS_24;
}
var __VLS_3;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
    },
    __typeProps: {},
});
;
