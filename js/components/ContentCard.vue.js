import { DomainUtils } from "@/domains/utils";
const props = defineProps();
DomainUtils.log("COMPONENTS ContentCard: setup");
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vRow;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    justify: "center",
}));
const __VLS_2 = __VLS_1({
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
vCol;
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    cols: "12",
}));
const __VLS_9 = __VLS_8({
    cols: "12",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
let __VLS_13;
vCard;
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    color: "secondary",
}));
const __VLS_15 = __VLS_14({
    color: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const { default: __VLS_18 } = __VLS_16.slots;
let __VLS_19;
vCardTitle;
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({}));
const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
const { default: __VLS_24 } = __VLS_22.slots;
(props.title);
var __VLS_22;
var __VLS_16;
var __VLS_10;
for (const [item] of __VLS_vFor((props.data))) {
    let __VLS_25;
    vCol;
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        key: (item.subTitle),
        cols: "12",
    }));
    const __VLS_27 = __VLS_26({
        key: (item.subTitle),
        cols: "12",
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    const { default: __VLS_30 } = __VLS_28.slots;
    let __VLS_31;
    vCard;
    const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({}));
    const __VLS_33 = __VLS_32({}, ...__VLS_functionalComponentArgsRest(__VLS_32));
    const { default: __VLS_36 } = __VLS_34.slots;
    let __VLS_37;
    vCardTitle;
    const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
        ...{ class: "d-flex" },
    }));
    const __VLS_39 = __VLS_38({
        ...{ class: "d-flex" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    ;
    const { default: __VLS_42 } = __VLS_40.slots;
    if (item.icon !== '') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        if (item.icon.substring(0, 1) === '$') {
            let __VLS_43;
            vIcon;
            const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
                icon: (item.icon),
            }));
            const __VLS_45 = __VLS_44({
                icon: (item.icon),
            }, ...__VLS_functionalComponentArgsRest(__VLS_44));
        }
        else {
            let __VLS_48;
            vImg;
            const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
                inline: (true),
                src: (item.icon),
                height: "32",
                width: "32",
            }));
            const __VLS_50 = __VLS_49({
                inline: (true),
                src: (item.icon),
                height: "32",
                width: "32",
            }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    (item.subTitle);
    var __VLS_40;
    let __VLS_53;
    vCardText;
    const __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({}));
    const __VLS_55 = __VLS_54({}, ...__VLS_functionalComponentArgsRest(__VLS_54));
    const { default: __VLS_58 } = __VLS_56.slots;
    (item.content);
    var __VLS_56;
    var __VLS_34;
    var __VLS_28;
}
var __VLS_3;
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
