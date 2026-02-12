import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { DomainUtils } from "@/domains/utils";
import DynamicList from "@/components/DynamicList.vue";
import ThemeSelector from "@/components/ThemeSelector.vue";
import ServiceSelector from "@/components/ServiceSelector.vue";
import CheckboxGrid from "@/components/CheckboxGrid.vue";
import AlertOverlay from "@/components/AlertOverlay.vue";
import { COMPONENTS } from "@/configs/components";
import { createTabs } from "@/configs/views";
const { t } = useI18n();
const TABS = computed(() => createTabs(t));
const tab = ref(0);
DomainUtils.log("VIEWS OptionsIndex: setup", window.location.href, "info");
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vApp;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    flat: true,
}));
const __VLS_2 = __VLS_1({
    flat: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
vMain;
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
let __VLS_13;
vContainer;
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({}));
const __VLS_15 = __VLS_14({}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const { default: __VLS_18 } = __VLS_16.slots;
let __VLS_19;
vTabs;
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    modelValue: (__VLS_ctx.tab),
    showArrows: true,
}));
const __VLS_21 = __VLS_20({
    modelValue: (__VLS_ctx.tab),
    showArrows: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
const { default: __VLS_24 } = __VLS_22.slots;
for (const [item, index] of __VLS_vFor((__VLS_ctx.TABS))) {
    let __VLS_25;
    vTab;
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        key: (item.id),
        value: (index),
    }));
    const __VLS_27 = __VLS_26({
        key: (item.id),
        value: (index),
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    const { default: __VLS_30 } = __VLS_28.slots;
    (item.title);
    [tab, TABS,];
    var __VLS_28;
    [];
}
[];
var __VLS_22;
let __VLS_31;
vTabsWindow;
const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
    modelValue: (__VLS_ctx.tab),
    ...{ class: "pa-5" },
}));
const __VLS_33 = __VLS_32({
    modelValue: (__VLS_ctx.tab),
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
;
const { default: __VLS_36 } = __VLS_34.slots;
let __VLS_37;
vTabsWindowItem;
const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
    value: (0),
}));
const __VLS_39 = __VLS_38({
    value: (0),
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
const { default: __VLS_42 } = __VLS_40.slots;
let __VLS_43;
vRow;
const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({}));
const __VLS_45 = __VLS_44({}, ...__VLS_functionalComponentArgsRest(__VLS_44));
const { default: __VLS_48 } = __VLS_46.slots;
let __VLS_49;
vCol;
const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
    cols: "12",
    md: "6",
    sm: "6",
}));
const __VLS_51 = __VLS_50({
    cols: "12",
    md: "6",
    sm: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
const { default: __VLS_54 } = __VLS_52.slots;
const __VLS_55 = ThemeSelector;
const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({}));
const __VLS_57 = __VLS_56({}, ...__VLS_functionalComponentArgsRest(__VLS_56));
[tab,];
var __VLS_52;
let __VLS_60;
vCol;
const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
    cols: "12",
    md: "6",
    sm: "6",
}));
const __VLS_62 = __VLS_61({
    cols: "12",
    md: "6",
    sm: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
const { default: __VLS_65 } = __VLS_63.slots;
const __VLS_66 = ServiceSelector;
const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({}));
const __VLS_68 = __VLS_67({}, ...__VLS_functionalComponentArgsRest(__VLS_67));
[];
var __VLS_63;
[];
var __VLS_46;
[];
var __VLS_40;
let __VLS_71;
vTabsWindowItem;
const __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71({
    value: (1),
}));
const __VLS_73 = __VLS_72({
    value: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_72));
const { default: __VLS_76 } = __VLS_74.slots;
let __VLS_77;
vRow;
const __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({
    ...{ class: "pa-10" },
    justify: "center",
}));
const __VLS_79 = __VLS_78({
    ...{ class: "pa-10" },
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_78));
;
const { default: __VLS_82 } = __VLS_80.slots;
let __VLS_83;
vCol;
const __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
    cols: "12",
    md: "10",
    sm: "10",
}));
const __VLS_85 = __VLS_84({
    cols: "12",
    md: "10",
    sm: "10",
}, ...__VLS_functionalComponentArgsRest(__VLS_84));
const { default: __VLS_88 } = __VLS_86.slots;
const __VLS_89 = DynamicList;
const __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
    type: (__VLS_ctx.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS),
}));
const __VLS_91 = __VLS_90({
    type: (__VLS_ctx.COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS),
}, ...__VLS_functionalComponentArgsRest(__VLS_90));
[COMPONENTS,];
var __VLS_86;
[];
var __VLS_80;
[];
var __VLS_74;
let __VLS_94;
vTabsWindowItem;
const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
    value: (2),
}));
const __VLS_96 = __VLS_95({
    value: (2),
}, ...__VLS_functionalComponentArgsRest(__VLS_95));
const { default: __VLS_99 } = __VLS_97.slots;
let __VLS_100;
vRow;
const __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({}));
const __VLS_102 = __VLS_101({}, ...__VLS_functionalComponentArgsRest(__VLS_101));
const { default: __VLS_105 } = __VLS_103.slots;
const __VLS_106 = CheckboxGrid;
const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
    type: (__VLS_ctx.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES),
}));
const __VLS_108 = __VLS_107({
    type: (__VLS_ctx.COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES),
}, ...__VLS_functionalComponentArgsRest(__VLS_107));
[COMPONENTS,];
var __VLS_103;
[];
var __VLS_97;
let __VLS_111;
vTabsWindowItem;
const __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111({
    value: (3),
}));
const __VLS_113 = __VLS_112({
    value: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_112));
const { default: __VLS_116 } = __VLS_114.slots;
let __VLS_117;
vRow;
const __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117({}));
const __VLS_119 = __VLS_118({}, ...__VLS_functionalComponentArgsRest(__VLS_118));
const { default: __VLS_122 } = __VLS_120.slots;
const __VLS_123 = CheckboxGrid;
const __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123({
    type: (__VLS_ctx.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS),
}));
const __VLS_125 = __VLS_124({
    type: (__VLS_ctx.COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS),
}, ...__VLS_functionalComponentArgsRest(__VLS_124));
[COMPONENTS,];
var __VLS_120;
[];
var __VLS_114;
let __VLS_128;
vTabsWindowItem;
const __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
    value: (4),
}));
const __VLS_130 = __VLS_129({
    value: (4),
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
const { default: __VLS_133 } = __VLS_131.slots;
let __VLS_134;
vRow;
const __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
    ...{ class: "pa-12" },
    justify: "center",
}));
const __VLS_136 = __VLS_135({
    ...{ class: "pa-12" },
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_135));
;
const { default: __VLS_139 } = __VLS_137.slots;
let __VLS_140;
vCol;
const __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140({
    cols: "12",
    md: "10",
    sm: "10",
}));
const __VLS_142 = __VLS_141({
    cols: "12",
    md: "10",
    sm: "10",
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
const { default: __VLS_145 } = __VLS_143.slots;
const __VLS_146 = DynamicList;
const __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146({
    type: (__VLS_ctx.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES),
}));
const __VLS_148 = __VLS_147({
    type: (__VLS_ctx.COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES),
}, ...__VLS_functionalComponentArgsRest(__VLS_147));
[COMPONENTS,];
var __VLS_143;
[];
var __VLS_137;
[];
var __VLS_131;
[];
var __VLS_34;
[];
var __VLS_16;
[];
var __VLS_10;
const __VLS_151 = AlertOverlay;
const __VLS_152 = __VLS_asFunctionalComponent1(__VLS_151, new __VLS_151({}));
const __VLS_153 = __VLS_152({}, ...__VLS_functionalComponentArgsRest(__VLS_152));
[];
var __VLS_3;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
