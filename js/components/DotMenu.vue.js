import { computed } from "vue";
import { useMenuAction, useMenuHighlight } from "@/composables/useMenu";
import MenuItem from "@/components/MenuItem.vue";
import { DomainUtils } from "@/domains/utils";
import { useAlertStore } from "@/stores/alerts";
const props = defineProps();
const alertStore = useAlertStore();
const { executeAction } = useMenuAction();
const { highlightedItems, highlightTemporary, clearAllHighlights } = useMenuHighlight();
const currentColor = computed(() => highlightedItems.value.get(props.recordId) || "");
const handleMenuOpen = () => {
    DomainUtils.log("DOT_MENU: handleMenuOpen", props.recordId);
    highlightTemporary(props.recordId);
};
const handleItemClick = async (item) => {
    DomainUtils.log("DOT_MENU: handleItemClick", [props.recordId, item.action]);
    try {
        await executeAction(item.action, props.recordId);
        clearAllHighlights();
    }
    catch (err) {
        DomainUtils.log("DOT_MENU: action failed", err, "error");
        alertStore.error("Menu Action Failed", err instanceof Error ? err.message : "An unknown error occurred");
    }
};
DomainUtils.log("COMPONENTS DotMenu: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VMenu;
;
VMenu;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
{
    const { activator: __VLS_6 } = __VLS_3.slots;
    const [{ props: menuProps }] = __VLS_getSlotParameters(__VLS_6);
    const __VLS_7 = {}.VBtn;
    ;
    VBtn;
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
        ...{ 'onClick': {} },
        color: (__VLS_ctx.currentColor),
        'aria-label': "Open menu",
        icon: "$dots",
        ...(menuProps),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onClick': {} },
        color: (__VLS_ctx.currentColor),
        'aria-label': "Open menu",
        icon: "$dots",
        ...(menuProps),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_11;
    let __VLS_12;
    const __VLS_13 = ({ click: {} },
        { onClick: (__VLS_ctx.handleMenuOpen) });
    [currentColor, handleMenuOpen,];
    var __VLS_10;
}
const __VLS_15 = {}.VList;
;
VList;
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    role: "menu",
}));
const __VLS_17 = __VLS_16({
    role: "menu",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
const { default: __VLS_19 } = __VLS_18.slots;
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.items))) {
    [items,];
    ;
    const __VLS_20 = __VLS_asFunctionalComponent(MenuItem, new MenuItem({
        ...{ 'onClick': {} },
        key: (item.id),
        isHighlighted: (__VLS_ctx.highlightedItems.has(__VLS_ctx.recordId)),
        item: (item),
    }));
    const __VLS_21 = __VLS_20({
        ...{ 'onClick': {} },
        key: (item.id),
        isHighlighted: (__VLS_ctx.highlightedItems.has(__VLS_ctx.recordId)),
        item: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    let __VLS_23;
    let __VLS_24;
    const __VLS_25 = ({ click: {} },
        { onClick: (__VLS_ctx.handleItemClick) });
    [highlightedItems, recordId, handleItemClick,];
    var __VLS_22;
}
var __VLS_18;
var __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            MenuItem: MenuItem,
            highlightedItems: highlightedItems,
            currentColor: currentColor,
            handleMenuOpen: handleMenuOpen,
            handleItemClick: handleItemClick,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
    },
    __typeProps: {},
});
;
