import { computed } from "vue";
import { DomainUtils } from "@/domains/utils";
const props = defineProps();
const emit = defineEmits();
const itemClass = computed(() => ({
    "menu-item": true,
    "menu-item--danger": props.item.variant === "danger",
    "menu-item--highlighted": props.isHighlighted
}));
DomainUtils.log("COMPONENTS MenuItem: setup");
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vHover;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
{
    const { default: __VLS_6 } = __VLS_3.slots;
    const [{ isHovering }] = __VLS_vSlot(__VLS_6);
    let __VLS_7;
    vListItem;
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onClick': {} },
        id: (__VLS_ctx.item.id),
        'aria-label': (__VLS_ctx.item.title),
        baseColor: (isHovering ? 'orange' : ''),
        ...{ class: (__VLS_ctx.itemClass) },
        prependIcon: (__VLS_ctx.item.icon),
        title: (__VLS_ctx.item.title),
        ...{ class: "pointer" },
        role: "menuitem",
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onClick': {} },
        id: (__VLS_ctx.item.id),
        'aria-label': (__VLS_ctx.item.title),
        baseColor: (isHovering ? 'orange' : ''),
        ...{ class: (__VLS_ctx.itemClass) },
        prependIcon: (__VLS_ctx.item.icon),
        title: (__VLS_ctx.item.title),
        ...{ class: "pointer" },
        role: "menuitem",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.emit('click', __VLS_ctx.item);
                [item, item, item, item, item, itemClass, emit,];
            } });
    ;
    var __VLS_10;
    var __VLS_11;
    [];
    __VLS_3.slots[''];
}
var __VLS_3;
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
