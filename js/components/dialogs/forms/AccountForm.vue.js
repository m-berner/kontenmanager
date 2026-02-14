import { onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useFavicon } from "@/composables/useFavicon";
import { useDomain } from "@/composables/useDomain";
import { useAccountForm } from "@/composables/useForms";
import { COMPONENTS } from "@/configs/components";
import { validationService } from "@/services/validation";
import { createIbanMessages, createSwiftMessages } from "@/domains/validation/messages";
import { DomainUtils } from "@/domains/utils";
const props = defineProps();
const { t } = useI18n();
const { accountFormData } = useAccountForm();
const SWIFT_RULES = createSwiftMessages(t);
const IBAN_RULES = createIbanMessages(t);
const search = ref("");
const swiftLabel = ref("");
const ibanLabel = ref("");
const onUpdateSwift = (swift) => {
    if (!swift) {
        swiftLabel.value = "";
        accountFormData.swift = "";
        return;
    }
    const clean = swift.replace(/\s/g, "").toUpperCase();
    accountFormData.swift = clean;
    swiftLabel.value =
        accountFormData.swift.length > 1
            ? ` / ${clean.replace(/(.{4})/g, "$1 ")}`
            : "";
};
const onUpdateIban = (iban) => {
    if (!iban) {
        ibanLabel.value = "";
        accountFormData.iban = "";
        return;
    }
    const clean = iban.replace(/\s/g, "").toUpperCase();
    accountFormData.iban = clean;
    ibanLabel.value =
        accountFormData.iban.length > 1
            ? ` / ${clean.replace(/(.{4})/g, "$1 ")}`
            : "";
};
const { domain } = useDomain(search);
const { faviconUrl } = useFavicon(domain);
let timeoutId;
watch(faviconUrl, (newUrl) => {
    if (timeoutId)
        clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        if (newUrl) {
            accountFormData.logoUrl = newUrl;
        }
    }, 400);
});
onBeforeUnmount(() => {
    if (timeoutId)
        clearTimeout(timeoutId);
});
DomainUtils.log("COMPONENTS DIALOGS FORMS AccountForm: setup");
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
vSwitch;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.accountFormData.withDepot),
    label: (__VLS_ctx.t('components.dialogs.forms.accountForm.withDepotLabel')),
    color: "red",
    variant: "outlined",
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.accountFormData.withDepot),
    label: (__VLS_ctx.t('components.dialogs.forms.accountForm.withDepotLabel')),
    color: "red",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
vTextField;
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.accountFormData.swift),
    counter: (11),
    label: (`${__VLS_ctx.t('components.dialogs.forms.accountForm.swiftLabel')}${__VLS_ctx.swiftLabel}`),
    rules: (__VLS_ctx.validationService.swiftRules(__VLS_ctx.SWIFT_RULES)),
    autofocus: true,
    variant: "outlined",
}));
const __VLS_7 = __VLS_6({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.accountFormData.swift),
    counter: (11),
    label: (`${__VLS_ctx.t('components.dialogs.forms.accountForm.swiftLabel')}${__VLS_ctx.swiftLabel}`),
    rules: (__VLS_ctx.validationService.swiftRules(__VLS_ctx.SWIFT_RULES)),
    autofocus: true,
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_10;
const __VLS_11 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onUpdateSwift) });
var __VLS_8;
var __VLS_9;
let __VLS_12;
vTextField;
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.accountFormData.iban),
    disabled: (props.isUpdate),
    label: (`${__VLS_ctx.t('components.dialogs.forms.accountForm.ibanLabel')}${__VLS_ctx.ibanLabel}`),
    placeholder: (__VLS_ctx.t('components.dialogs.forms.accountForm.ibanPlaceholder')),
    rules: (__VLS_ctx.validationService.ibanRules(__VLS_ctx.IBAN_RULES)),
    variant: "outlined",
}));
const __VLS_14 = __VLS_13({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.accountFormData.iban),
    disabled: (props.isUpdate),
    label: (`${__VLS_ctx.t('components.dialogs.forms.accountForm.ibanLabel')}${__VLS_ctx.ibanLabel}`),
    placeholder: (__VLS_ctx.t('components.dialogs.forms.accountForm.ibanPlaceholder')),
    rules: (__VLS_ctx.validationService.ibanRules(__VLS_ctx.IBAN_RULES)),
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_17;
const __VLS_18 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onUpdateIban) });
var __VLS_15;
var __VLS_16;
let __VLS_19;
vTextField;
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    modelValue: (__VLS_ctx.search),
    label: (__VLS_ctx.t('components.dialogs.forms.accountForm.searchLabel')),
    placeholder: (__VLS_ctx.COMPONENTS.DIALOGS.PLACEHOLDER.ACCOUNT_LOGO_URL),
    variant: "outlined",
}));
const __VLS_21 = __VLS_20({
    modelValue: (__VLS_ctx.search),
    label: (__VLS_ctx.t('components.dialogs.forms.accountForm.searchLabel')),
    placeholder: (__VLS_ctx.COMPONENTS.DIALOGS.PLACEHOLDER.ACCOUNT_LOGO_URL),
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mb-4" },
});
;
let __VLS_24;
vAvatar;
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    ...{ class: "me-3" },
    color: "white",
    size: "48",
}));
const __VLS_26 = __VLS_25({
    ...{ class: "me-3" },
    color: "white",
    size: "48",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
;
const { default: __VLS_29 } = __VLS_27.slots;
let __VLS_30;
vImg;
const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
    alt: (__VLS_ctx.t('components.dialogs.forms.accountForm.missingLogo')),
    src: (__VLS_ctx.accountFormData.logoUrl),
}));
const __VLS_32 = __VLS_31({
    alt: (__VLS_ctx.t('components.dialogs.forms.accountForm.missingLogo')),
    src: (__VLS_ctx.accountFormData.logoUrl),
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
[accountFormData, accountFormData, accountFormData, accountFormData, t, t, t, t, t, t, swiftLabel, validationService, validationService, SWIFT_RULES, onUpdateSwift, ibanLabel, IBAN_RULES, onUpdateIban, search, COMPONENTS,];
var __VLS_27;
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
