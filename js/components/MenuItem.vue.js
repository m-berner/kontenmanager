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
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VHover;
;
VHover;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
{
    const { default: __VLS_5 } = __VLS_3.slots;
    const [{ isHovering }] = __VLS_getSlotParameters(__VLS_5);
    const __VLS_6 = {}.VListItem;
    ;
    VListItem;
    const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
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
    const __VLS_8 = __VLS_7({
        ...{ 'onClick': {} },
        id: (__VLS_ctx.item.id),
        'aria-label': (__VLS_ctx.item.title),
        baseColor: (isHovering ? 'orange' : ''),
        ...{ class: (__VLS_ctx.itemClass) },
        prependIcon: (__VLS_ctx.item.icon),
        title: (__VLS_ctx.item.title),
        ...{ class: "pointer" },
        role: "menuitem",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_10;
    let __VLS_11;
    const __VLS_12 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.emit('click', __VLS_ctx.item);
                [item, item, item, item, item, itemClass, emit,];
            } });
    var __VLS_9;
    __VLS_3.slots[''];
}
var __VLS_3;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            itemClass: itemClass,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
    },
    __typeEmits: {},
    __typeProps: {},
});
;
