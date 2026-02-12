import { computed, onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify/framework";
import { DomainUtils } from "@/domains/utils";
import { useStorage } from "@/composables/useStorage";
import { useAlert } from "@/composables/useAlert";
import { BROWSER_STORAGE } from "@/domains/configs/storage";
import { createThemes } from "@/configs/views";
const { t } = useI18n();
const theme = useTheme();
const { getStorage, setStorage } = useStorage();
const { handleUserError } = useAlert();
const THEMES = computed(() => createThemes(t));
const skin = ref("");
const setSkin = async () => {
    DomainUtils.log("COMPONENTS THEME_SELECTOR: setSkin");
    try {
        await setStorage(BROWSER_STORAGE.SKIN.key, skin.value);
    }
    catch (err) {
        await handleUserError("Components ThemeSelector", err, {});
    }
};
onBeforeMount(async () => {
    DomainUtils.log("COMPONENTS THEME_SELECTOR: onBeforeMount");
    const storageSkin = await getStorage([BROWSER_STORAGE.SKIN.key]);
    skin.value =
        storageSkin[BROWSER_STORAGE.SKIN.key] ||
            BROWSER_STORAGE.SKIN.value;
});
DomainUtils.log("COMPONENTS THEME_SELECTOR: setup");
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vRadioGroup;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.skin),
    column: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.skin),
    column: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (async () => {
            await __VLS_ctx.setSkin();
        }) });
var __VLS_7 = {};
const { default: __VLS_8 } = __VLS_3.slots;
for (const [item] of __VLS_vFor((Object.keys(__VLS_ctx.theme.themes.value)))) {
    let __VLS_9;
    vRadio;
    const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
        key: (item),
        label: (__VLS_ctx.THEMES[item]),
        value: (item),
    }));
    const __VLS_11 = __VLS_10({
        key: (item),
        label: (__VLS_ctx.THEMES[item]),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    [skin, setSkin, theme, THEMES,];
}
[];
var __VLS_3;
var __VLS_4;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
