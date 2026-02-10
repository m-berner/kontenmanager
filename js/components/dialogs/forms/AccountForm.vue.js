import { onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useFavicon } from "@/composables/useFavicon";
import { useDomain } from "@/composables/useDomain";
import { useAccountForm } from "@/composables/useForms";
import { COMPONENTS } from "@/config/components";
import { ValidationService } from "@/services/validation";
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
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VSwitch;
;
VSwitch;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
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
[accountFormData, t,];
const __VLS_5 = {}.VTextField;
;
VTextField;
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.accountFormData.swift),
    counter: (11),
    label: (`${__VLS_ctx.t('components.dialogs.forms.accountForm.swiftLabel')}${__VLS_ctx.swiftLabel}`),
    rules: (__VLS_ctx.ValidationService.swiftRules(__VLS_ctx.SWIFT_RULES)),
    autofocus: true,
    variant: "outlined",
}));
const __VLS_7 = __VLS_6({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.accountFormData.swift),
    counter: (11),
    label: (`${__VLS_ctx.t('components.dialogs.forms.accountForm.swiftLabel')}${__VLS_ctx.swiftLabel}`),
    rules: (__VLS_ctx.ValidationService.swiftRules(__VLS_ctx.SWIFT_RULES)),
    autofocus: true,
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_9;
let __VLS_10;
const __VLS_11 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onUpdateSwift) });
[accountFormData, t, swiftLabel, ValidationService, SWIFT_RULES, onUpdateSwift,];
var __VLS_8;
const __VLS_13 = {}.VTextField;
;
VTextField;
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.accountFormData.iban),
    disabled: (props.isUpdate),
    label: (`${__VLS_ctx.t('components.dialogs.forms.accountForm.ibanLabel')}${__VLS_ctx.ibanLabel}`),
    placeholder: (__VLS_ctx.t('components.dialogs.forms.accountForm.ibanPlaceholder')),
    rules: (__VLS_ctx.ValidationService.ibanRules(__VLS_ctx.IBAN_RULES)),
    variant: "outlined",
}));
const __VLS_15 = __VLS_14({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.accountFormData.iban),
    disabled: (props.isUpdate),
    label: (`${__VLS_ctx.t('components.dialogs.forms.accountForm.ibanLabel')}${__VLS_ctx.ibanLabel}`),
    placeholder: (__VLS_ctx.t('components.dialogs.forms.accountForm.ibanPlaceholder')),
    rules: (__VLS_ctx.ValidationService.ibanRules(__VLS_ctx.IBAN_RULES)),
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
let __VLS_17;
let __VLS_18;
const __VLS_19 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onUpdateIban) });
[accountFormData, t, t, ValidationService, ibanLabel, IBAN_RULES, onUpdateIban,];
var __VLS_16;
const __VLS_21 = {}.VTextField;
;
VTextField;
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    modelValue: (__VLS_ctx.search),
    label: (__VLS_ctx.t('components.dialogs.forms.accountForm.searchLabel')),
    placeholder: (__VLS_ctx.COMPONENTS.DIALOGS.PLACEHOLDER.ACCOUNT_LOGO_URL),
    variant: "outlined",
}));
const __VLS_23 = __VLS_22({
    modelValue: (__VLS_ctx.search),
    label: (__VLS_ctx.t('components.dialogs.forms.accountForm.searchLabel')),
    placeholder: (__VLS_ctx.COMPONENTS.DIALOGS.PLACEHOLDER.ACCOUNT_LOGO_URL),
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
[t, search, COMPONENTS,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-4" },
});
const __VLS_26 = {}.VAvatar;
;
VAvatar;
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    ...{ class: "me-3" },
    color: "white",
    size: "48",
}));
const __VLS_28 = __VLS_27({
    ...{ class: "me-3" },
    color: "white",
    size: "48",
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
const { default: __VLS_30 } = __VLS_29.slots;
const __VLS_31 = {}.VImg;
;
VImg;
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    alt: (__VLS_ctx.t('components.dialogs.forms.accountForm.missingLogo')),
    src: (__VLS_ctx.accountFormData.logoUrl),
}));
const __VLS_33 = __VLS_32({
    alt: (__VLS_ctx.t('components.dialogs.forms.accountForm.missingLogo')),
    src: (__VLS_ctx.accountFormData.logoUrl),
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
[accountFormData, t,];
var __VLS_29;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            COMPONENTS: COMPONENTS,
            ValidationService: ValidationService,
            t: t,
            accountFormData: accountFormData,
            SWIFT_RULES: SWIFT_RULES,
            IBAN_RULES: IBAN_RULES,
            search: search,
            swiftLabel: swiftLabel,
            ibanLabel: ibanLabel,
            onUpdateSwift: onUpdateSwift,
            onUpdateIban: onUpdateIban,
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
