import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { DomainUtils } from "@/domains/utils";
import DynamicList from "@/components/DynamicList.vue";
import ThemeSelector from "@/components/ThemeSelector.vue";
import ServiceSelector from "@/components/ServiceSelector.vue";
import CheckboxGrid from "@/components/CheckboxGrid.vue";
import AlertOverlay from "@/components/AlertOverlay.vue";
import { COMPONENTS } from "@/config/components";
import { createTabs } from "@/config/views";
const { t } = useI18n();
const TABS = computed(() => createTabs(t));
const tab = ref(0);
DomainUtils.log("VIES OptionsIndex: setup", window.location.href, "info");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VApp;
;
VApp;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    flat: true,
}));
const __VLS_2 = __VLS_1({
    flat: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
const __VLS_6 = {}.VMain;
;
VMain;
const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_10 } = __VLS_9.slots;
const __VLS_11 = {}.VContainer;
;
VContainer;
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({}));
const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
const { default: __VLS_15 } = __VLS_14.slots;
const __VLS_16 = {}.VTabs;
;
VTabs;
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.tab),
    showArrows: true,
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.tab),
    showArrows: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const { default: __VLS_20 } = __VLS_19.slots;
[tab,];
for (const [item, index] of __VLS_getVForSourceType((__VLS_ctx.TABS))) {
    [TABS,];
    const __VLS_21 = {}.VTab;
    ;
    VTab;
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
        key: (item.id),
        value: (index),
    }));
    const __VLS_23 = __VLS_22({
        key: (item.id),
        value: (index),
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    const { default: __VLS_25 } = __VLS_24.slots;
    (item.title);
    var __VLS_24;
}
var __VLS_19;
const __VLS_26 = {}.VTabsWindow;
;
VTabsWindow;
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    modelValue: (__VLS_ctx.tab),
    ...{ class: "pa-5" },
}));
const __VLS_28 = __VLS_27({
    modelValue: (__VLS_ctx.tab),
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
const { default: __VLS_30 } = __VLS_29.slots;
[tab,];
const __VLS_31 = {}.VTabsWindowItem;
;
VTabsWindowItem;
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    value: (0),
}));
const __VLS_33 = __VLS_32({
    value: (0),
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
const { default: __VLS_35 } = __VLS_34.slots;
const __VLS_36 = {}.VRow;
;
VRow;
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({}));
const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const { default: __VLS_40 } = __VLS_39.slots;
const __VLS_41 = {}.VCol;
;
VCol;
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    cols: "12",
    md: "6",
    sm: "6",
}));
const __VLS_43 = __VLS_42({
    cols: "12",
    md: "6",
    sm: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
const { default: __VLS_45 } = __VLS_44.slots;
;
const __VLS_46 = __VLS_asFunctionalComponent(ThemeSelector, new ThemeSelector({}));
const __VLS_47 = __VLS_46({}, ...__VLS_functionalComponentArgsRest(__VLS_46));
var __VLS_44;
const __VLS_50 = {}.VCol;
;
VCol;
const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
    cols: "12",
    md: "6",
    sm: "6",
}));
const __VLS_52 = __VLS_51({
    cols: "12",
    md: "6",
    sm: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_51));
const { default: __VLS_54 } = __VLS_53.slots;
;
const __VLS_55 = __VLS_asFunctionalComponent(ServiceSelector, new ServiceSelector({}));
const __VLS_56 = __VLS_55({}, ...__VLS_functionalComponentArgsRest(__VLS_55));
var __VLS_53;
var __VLS_39;
var __VLS_34;
const __VLS_59 = {}.VTabsWindowItem;
;
VTabsWindowItem;
const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
    value: (1),
}));
const __VLS_61 = __VLS_60({
    value: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_60));
const { default: __VLS_63 } = __VLS_62.slots;
const __VLS_64 = {}.VRow;
;
VRow;
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    ...{ class: "pa-10" },
    justify: "center",
}));
const __VLS_66 = __VLS_65({
    ...{ class: "pa-10" },
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
const { default: __VLS_68 } = __VLS_67.slots;
const __VLS_69 = {}.VCol;
;
VCol;
const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
    cols: "12",
    md: "10",
    sm: "10",
}));
const __VLS_71 = __VLS_70({
    cols: "12",
    md: "10",
    sm: "10",
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
const { default: __VLS_73 } = __VLS_72.slots;
;
const __VLS_74 = __VLS_asFunctionalComponent(DynamicList, new DynamicList({
    type: (__VLS_ctx.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS),
}));
const __VLS_75 = __VLS_74({
    type: (__VLS_ctx.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS),
}, ...__VLS_functionalComponentArgsRest(__VLS_74));
[COMPONENTS,];
var __VLS_72;
var __VLS_67;
var __VLS_62;
const __VLS_78 = {}.VTabsWindowItem;
;
VTabsWindowItem;
const __VLS_79 = __VLS_asFunctionalComponent(__VLS_78, new __VLS_78({
    value: (2),
}));
const __VLS_80 = __VLS_79({
    value: (2),
}, ...__VLS_functionalComponentArgsRest(__VLS_79));
const { default: __VLS_82 } = __VLS_81.slots;
const __VLS_83 = {}.VRow;
;
VRow;
const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({}));
const __VLS_85 = __VLS_84({}, ...__VLS_functionalComponentArgsRest(__VLS_84));
const { default: __VLS_87 } = __VLS_86.slots;
;
const __VLS_88 = __VLS_asFunctionalComponent(CheckboxGrid, new CheckboxGrid({
    type: (__VLS_ctx.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES),
}));
const __VLS_89 = __VLS_88({
    type: (__VLS_ctx.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES),
}, ...__VLS_functionalComponentArgsRest(__VLS_88));
[COMPONENTS,];
var __VLS_86;
var __VLS_81;
const __VLS_92 = {}.VTabsWindowItem;
;
VTabsWindowItem;
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    value: (3),
}));
const __VLS_94 = __VLS_93({
    value: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
const { default: __VLS_96 } = __VLS_95.slots;
const __VLS_97 = {}.VRow;
;
VRow;
const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({}));
const __VLS_99 = __VLS_98({}, ...__VLS_functionalComponentArgsRest(__VLS_98));
const { default: __VLS_101 } = __VLS_100.slots;
;
const __VLS_102 = __VLS_asFunctionalComponent(CheckboxGrid, new CheckboxGrid({
    type: (__VLS_ctx.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS),
}));
const __VLS_103 = __VLS_102({
    type: (__VLS_ctx.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS),
}, ...__VLS_functionalComponentArgsRest(__VLS_102));
[COMPONENTS,];
var __VLS_100;
var __VLS_95;
const __VLS_106 = {}.VTabsWindowItem;
;
VTabsWindowItem;
const __VLS_107 = __VLS_asFunctionalComponent(__VLS_106, new __VLS_106({
    value: (4),
}));
const __VLS_108 = __VLS_107({
    value: (4),
}, ...__VLS_functionalComponentArgsRest(__VLS_107));
const { default: __VLS_110 } = __VLS_109.slots;
const __VLS_111 = {}.VRow;
;
VRow;
const __VLS_112 = __VLS_asFunctionalComponent(__VLS_111, new __VLS_111({
    ...{ class: "pa-12" },
    justify: "center",
}));
const __VLS_113 = __VLS_112({
    ...{ class: "pa-12" },
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_112));
const { default: __VLS_115 } = __VLS_114.slots;
const __VLS_116 = {}.VCol;
;
VCol;
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    cols: "12",
    md: "10",
    sm: "10",
}));
const __VLS_118 = __VLS_117({
    cols: "12",
    md: "10",
    sm: "10",
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
const { default: __VLS_120 } = __VLS_119.slots;
;
const __VLS_121 = __VLS_asFunctionalComponent(DynamicList, new DynamicList({
    type: (__VLS_ctx.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES),
}));
const __VLS_122 = __VLS_121({
    type: (__VLS_ctx.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES),
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
[COMPONENTS,];
var __VLS_119;
var __VLS_114;
var __VLS_109;
var __VLS_29;
var __VLS_14;
var __VLS_9;
;
const __VLS_125 = __VLS_asFunctionalComponent(AlertOverlay, new AlertOverlay({}));
const __VLS_126 = __VLS_125({}, ...__VLS_functionalComponentArgsRest(__VLS_125));
var __VLS_3;
;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            DynamicList: DynamicList,
            ThemeSelector: ThemeSelector,
            ServiceSelector: ServiceSelector,
            CheckboxGrid: CheckboxGrid,
            AlertOverlay: AlertOverlay,
            COMPONENTS: COMPONENTS,
            TABS: TABS,
            tab: tab,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
