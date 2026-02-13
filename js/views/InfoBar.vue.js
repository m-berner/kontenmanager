import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { DomainUtils } from "@/domains/utils";
import { STORES, TRANSLATION_KEYS } from "@/configs/stores";
const { n, t } = useI18n();
const runtime = useRuntimeStore();
const { curUsd, infoMaterials } = storeToRefs(runtime);
const settings = useSettingsStore();
const materialValues = computed(() => {
    const result = new Map();
    for (const item of settings.materials) {
        const code = STORES.MATERIALS[item] ?? "";
        const usdValue = infoMaterials.value.get(code) ?? 0;
        const localValue = usdValue / curUsd.value;
        result.set(item, { usd: usdValue, local: localValue });
    }
    return result;
});
DomainUtils.log("VIEWS InfoBar: setup");
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vAppBar;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    app: true,
    color: "secondary",
    flat: true,
}));
const __VLS_2 = __VLS_1({
    app: true,
    color: "secondary",
    flat: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
vList;
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    bgColor: "secondary",
    ...{ class: "horizontal-list" },
    lines: "two",
}));
const __VLS_9 = __VLS_8({
    bgColor: "secondary",
    ...{ class: "horizontal-list" },
    lines: "two",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
;
const { default: __VLS_12 } = __VLS_10.slots;
for (const [item] of __VLS_vFor((__VLS_ctx.settings.exchanges))) {
    let __VLS_13;
    vListItem;
    const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        key: (item),
    }));
    const __VLS_15 = __VLS_14({
        key: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    const { default: __VLS_18 } = __VLS_16.slots;
    let __VLS_19;
    vListItemTitle;
    const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({}));
    const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
    const { default: __VLS_24 } = __VLS_22.slots;
    (item);
    [settings,];
    var __VLS_22;
    let __VLS_25;
    vListItemSubtitle;
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({}));
    const __VLS_27 = __VLS_26({}, ...__VLS_functionalComponentArgsRest(__VLS_26));
    const { default: __VLS_30 } = __VLS_28.slots;
    (__VLS_ctx.n(__VLS_ctx.runtime.infoExchanges.get(item) ?? 1, "decimal3"));
    [n, runtime,];
    var __VLS_28;
    [];
    var __VLS_16;
    [];
}
for (const [item] of __VLS_vFor((__VLS_ctx.settings.indexes))) {
    let __VLS_31;
    vListItem;
    const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
        key: (item),
    }));
    const __VLS_33 = __VLS_32({
        key: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    const { default: __VLS_36 } = __VLS_34.slots;
    let __VLS_37;
    vListItemTitle;
    const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({}));
    const __VLS_39 = __VLS_38({}, ...__VLS_functionalComponentArgsRest(__VLS_38));
    const { default: __VLS_42 } = __VLS_40.slots;
    (__VLS_ctx.STORES.INDEXES[item]);
    [settings, STORES,];
    var __VLS_40;
    let __VLS_43;
    vListItemSubtitle;
    const __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({}));
    const __VLS_45 = __VLS_44({}, ...__VLS_functionalComponentArgsRest(__VLS_44));
    const { default: __VLS_48 } = __VLS_46.slots;
    (__VLS_ctx.n(__VLS_ctx.runtime.infoIndexes.get(item) ?? 0, "integer"));
    [n, runtime,];
    var __VLS_46;
    [];
    var __VLS_34;
    [];
}
for (const [item] of __VLS_vFor((__VLS_ctx.settings.materials))) {
    let __VLS_49;
    vListItem;
    const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
        key: (item),
    }));
    const __VLS_51 = __VLS_50({
        key: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    const { default: __VLS_54 } = __VLS_52.slots;
    let __VLS_55;
    vListItemTitle;
    const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({}));
    const __VLS_57 = __VLS_56({}, ...__VLS_functionalComponentArgsRest(__VLS_56));
    const { default: __VLS_60 } = __VLS_58.slots;
    (__VLS_ctx.t(__VLS_ctx.TRANSLATION_KEYS[item]));
    [settings, t, TRANSLATION_KEYS,];
    var __VLS_58;
    let __VLS_61;
    vListItemSubtitle;
    const __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({}));
    const __VLS_63 = __VLS_62({}, ...__VLS_functionalComponentArgsRest(__VLS_62));
    const { default: __VLS_66 } = __VLS_64.slots;
    (__VLS_ctx.n(__VLS_ctx.materialValues.get(item)?.usd ?? 0, "currencyUSD") +
        " / " +
        __VLS_ctx.n(__VLS_ctx.materialValues.get(item)?.local ?? 0, "currency"));
    [n, n, materialValues, materialValues,];
    var __VLS_64;
    [];
    var __VLS_52;
    [];
}
[];
var __VLS_10;
[];
var __VLS_3;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
