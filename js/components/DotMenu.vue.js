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
    DomainUtils.log("COMPONENTS DotMenu: handleMenuOpen", props.recordId);
    highlightTemporary(props.recordId);
};
const handleItemClick = async (item) => {
    DomainUtils.log("COMPONENTS DotMenu: handleItemClick", [props.recordId, item.action]);
    try {
        await executeAction(item.action, props.recordId);
        clearAllHighlights();
    }
    catch (err) {
        DomainUtils.log("COMPONENTS DotMenu: action failed", err, "error");
        alertStore.error("Menu Action Failed", err instanceof Error ? err.message : "An unknown error occurred");
    }
};
DomainUtils.log("COMPONENTS DotMenu: setup");
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vMenu;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
{
    const { activator: __VLS_7 } = __VLS_3.slots;
    const [{ props: menuProps }] = __VLS_vSlot(__VLS_7);
    let __VLS_8;
    vBtn;
    const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        color: (__VLS_ctx.currentColor),
        'aria-label': "Open menu",
        icon: "$dots",
        ...(menuProps),
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        color: (__VLS_ctx.currentColor),
        'aria-label': "Open menu",
        icon: "$dots",
        ...(menuProps),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_13;
    const __VLS_14 = ({ click: {} },
        { onClick: (__VLS_ctx.handleMenuOpen) });
    var __VLS_11;
    var __VLS_12;
    [currentColor, handleMenuOpen,];
}
let __VLS_15;
vList;
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    role: "menu",
}));
const __VLS_17 = __VLS_16({
    role: "menu",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
const { default: __VLS_20 } = __VLS_18.slots;
for (const [item] of __VLS_vFor((__VLS_ctx.items))) {
    const __VLS_21 = MenuItem;
    const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
        ...{ 'onClick': {} },
        key: (item.id),
        isHighlighted: (__VLS_ctx.highlightedItems.has(__VLS_ctx.recordId)),
        item: (item),
    }));
    const __VLS_23 = __VLS_22({
        ...{ 'onClick': {} },
        key: (item.id),
        isHighlighted: (__VLS_ctx.highlightedItems.has(__VLS_ctx.recordId)),
        item: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    let __VLS_26;
    const __VLS_27 = ({ click: {} },
        { onClick: (__VLS_ctx.handleItemClick) });
    var __VLS_24;
    var __VLS_25;
    [items, highlightedItems, recordId, handleItemClick,];
}
[];
var __VLS_18;
[];
var __VLS_3;
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
