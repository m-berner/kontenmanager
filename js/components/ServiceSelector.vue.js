import { onBeforeMount, ref } from "vue";
import { DomainUtils } from "@/domains/utils";
import { useStorage } from "@/composables/useStorage";
import { useAlert } from "@/composables/useAlert";
import { BROWSER_STORAGE } from "@/domains/config/storage";
import { FETCH } from "@/config/fetch";
const { getStorage, setStorage } = useStorage();
const { handleUserError } = useAlert();
const service = ref(BROWSER_STORAGE.SERVICE.value);
const setService = async () => {
    DomainUtils.log("SERVICE_SELECTOR: setService");
    try {
        await setStorage(BROWSER_STORAGE.SERVICE.key, service.value);
    }
    catch (err) {
        await handleUserError("Components ServiceSelector", err, {});
    }
};
const serviceLabels = (item) => {
    const service = FETCH.MAP.get(item);
    if (service !== undefined && service?.NAME !== undefined) {
        return service.NAME;
    }
    else {
        return "Label not found";
    }
};
onBeforeMount(async () => {
    DomainUtils.log("SERVICE_SELECTOR: onBeforeMount");
    try {
        const storageService = await getStorage([BROWSER_STORAGE.SERVICE.key]);
        service.value = storageService[BROWSER_STORAGE.SERVICE.key];
    }
    catch (err) {
        await handleUserError("Components ServiceSelector", err, {});
    }
});
DomainUtils.log("COMPONENTS ServiceSelector: setup");
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
    modelValue: (__VLS_ctx.service),
    column: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.service),
    column: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (async () => {
            await __VLS_ctx.setService();
        }) });
var __VLS_7 = {};
const { default: __VLS_8 } = __VLS_3.slots;
for (const [item] of __VLS_vFor(([...__VLS_ctx.FETCH.MAP.keys()]))) {
    let __VLS_9;
    vRadio;
    const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
        key: (item),
        label: (__VLS_ctx.serviceLabels(item)),
        value: (item),
    }));
    const __VLS_11 = __VLS_10({
        key: (item),
        label: (__VLS_ctx.serviceLabels(item)),
        value: (item),
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    [service, setService, FETCH, serviceLabels,];
}
[];
var __VLS_3;
var __VLS_4;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
