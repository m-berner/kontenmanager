import { useI18n } from "vue-i18n";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { useStockForm } from "@/composables/useForms";
import { fetchService } from "@/services/fetch";
import { ValidationService } from "@/services/validation";
const props = defineProps();
const { t } = useI18n();
const { stockFormData } = useStockForm();
const NAME_RULES = [
    t("validators.nameRules.required"),
    t("validators.nameRules.length"),
    t("validators.nameRules.begin")
];
const ISIN_RULES = [
    t("validators.isinRules.required"),
    t("validators.isinRules.length"),
    t("validators.isinRules.format"),
    t("validators.isinRules.country"),
    t("validators.isinRules.luhn")
];
const onUpdateIsin = async () => {
    DomainUtils.log("STOCK_FORMULAR: onUpdateISIN");
    try {
        if (!props.isUpdate && stockFormData.isin.length === 12) {
            stockFormData.isin = stockFormData.isin.toUpperCase().replace(/\s/g, "");
            const companyData = await fetchService.fetchCompanyData(stockFormData.isin);
            stockFormData.company = companyData.company;
            stockFormData.symbol = companyData.symbol;
        }
    }
    catch {
        stockFormData.company = "";
        stockFormData.symbol = "";
        throw new AppError(ERROR_CODES.STOCK_FORM, ERROR_CATEGORY.VALIDATION, true);
    }
};
DomainUtils.log("COMPONENTS DIALOGS FORMS StockForm: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VContainer;
;
VContainer;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_4 } = __VLS_3.slots;
const __VLS_5 = {}.VRow;
;
VRow;
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const { default: __VLS_9 } = __VLS_8.slots;
const __VLS_10 = {}.VTextField;
;
VTextField;
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.stockFormData.isin),
    counter: (12),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.isinLabel')),
    rules: (__VLS_ctx.ValidationService.isinRules(__VLS_ctx.ISIN_RULES)),
    autofocus: true,
    variant: "outlined",
}));
const __VLS_12 = __VLS_11({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.stockFormData.isin),
    counter: (12),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.isinLabel')),
    rules: (__VLS_ctx.ValidationService.isinRules(__VLS_ctx.ISIN_RULES)),
    autofocus: true,
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
let __VLS_14;
let __VLS_15;
const __VLS_16 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onUpdateIsin) });
[stockFormData, t, ValidationService, ISIN_RULES, onUpdateIsin,];
var __VLS_13;
var __VLS_8;
const __VLS_18 = {}.VRow;
;
VRow;
const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({}));
const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
const { default: __VLS_22 } = __VLS_21.slots;
const __VLS_23 = {}.VTextField;
;
VTextField;
const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
    modelValue: (__VLS_ctx.stockFormData.company),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.companyLabel')),
    required: true,
    variant: "outlined",
}));
const __VLS_25 = __VLS_24({
    modelValue: (__VLS_ctx.stockFormData.company),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.companyLabel')),
    required: true,
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
[stockFormData, t,];
var __VLS_21;
const __VLS_28 = {}.VRow;
;
VRow;
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    cols: "2",
    sm: "2",
}));
const __VLS_30 = __VLS_29({
    cols: "2",
    sm: "2",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const { default: __VLS_32 } = __VLS_31.slots;
const __VLS_33 = {}.VCol;
;
VCol;
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({}));
const __VLS_35 = __VLS_34({}, ...__VLS_functionalComponentArgsRest(__VLS_34));
const __VLS_38 = {}.VCol;
;
VCol;
const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({}));
const __VLS_40 = __VLS_39({}, ...__VLS_functionalComponentArgsRest(__VLS_39));
const { default: __VLS_42 } = __VLS_41.slots;
const __VLS_43 = {}.VTextField;
;
VTextField;
const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
    modelValue: (__VLS_ctx.stockFormData.symbol),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.symbolLabel')),
    rules: (__VLS_ctx.ValidationService.nameRules(__VLS_ctx.NAME_RULES)),
    required: true,
    variant: "outlined",
}));
const __VLS_45 = __VLS_44({
    modelValue: (__VLS_ctx.stockFormData.symbol),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.symbolLabel')),
    rules: (__VLS_ctx.ValidationService.nameRules(__VLS_ctx.NAME_RULES)),
    required: true,
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_44));
[stockFormData, t, ValidationService, NAME_RULES,];
var __VLS_41;
var __VLS_31;
var __VLS_3;
if (props.isUpdate) {
    const __VLS_48 = {}.VContainer;
    ;
    VContainer;
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({}));
    const __VLS_50 = __VLS_49({}, ...__VLS_functionalComponentArgsRest(__VLS_49));
    const { default: __VLS_52 } = __VLS_51.slots;
    const __VLS_53 = {}.VRow;
    ;
    VRow;
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        cols: "2",
        sm: "2",
    }));
    const __VLS_55 = __VLS_54({
        cols: "2",
        sm: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    const { default: __VLS_57 } = __VLS_56.slots;
    const __VLS_58 = {}.VCol;
    ;
    VCol;
    const __VLS_59 = __VLS_asFunctionalComponent(__VLS_58, new __VLS_58({}));
    const __VLS_60 = __VLS_59({}, ...__VLS_functionalComponentArgsRest(__VLS_59));
    const { default: __VLS_62 } = __VLS_61.slots;
    const __VLS_63 = {}.VTextField;
    ;
    VTextField;
    const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
        modelValue: (__VLS_ctx.stockFormData.meetingDay),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.meetingDayLabel')),
        type: "date",
        variant: "outlined",
    }));
    const __VLS_65 = __VLS_64({
        modelValue: (__VLS_ctx.stockFormData.meetingDay),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.meetingDayLabel')),
        type: "date",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_64));
    [stockFormData, t,];
    var __VLS_61;
    const __VLS_68 = {}.VCol;
    ;
    VCol;
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({}));
    const __VLS_70 = __VLS_69({}, ...__VLS_functionalComponentArgsRest(__VLS_69));
    const { default: __VLS_72 } = __VLS_71.slots;
    const __VLS_73 = {}.VTextField;
    ;
    VTextField;
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        modelValue: (__VLS_ctx.stockFormData.quarterDay),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.quarterDayLabel')),
        type: "date",
        variant: "outlined",
    }));
    const __VLS_75 = __VLS_74({
        modelValue: (__VLS_ctx.stockFormData.quarterDay),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.quarterDayLabel')),
        type: "date",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    [stockFormData, t,];
    var __VLS_71;
    var __VLS_56;
    const __VLS_78 = {}.VRow;
    ;
    VRow;
    const __VLS_79 = __VLS_asFunctionalComponent(__VLS_78, new __VLS_78({
        cols: "2",
        sm: "2",
    }));
    const __VLS_80 = __VLS_79({
        cols: "2",
        sm: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_79));
    const { default: __VLS_82 } = __VLS_81.slots;
    const __VLS_83 = {}.VCol;
    ;
    VCol;
    const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({}));
    const __VLS_85 = __VLS_84({}, ...__VLS_functionalComponentArgsRest(__VLS_84));
    const { default: __VLS_87 } = __VLS_86.slots;
    const __VLS_88 = {}.VCheckbox;
    ;
    VCheckbox;
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        modelValue: (__VLS_ctx.stockFormData.fadeOut),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.fadeOutLabel')),
        variant: "outlined",
    }));
    const __VLS_90 = __VLS_89({
        modelValue: (__VLS_ctx.stockFormData.fadeOut),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.fadeOutLabel')),
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    [stockFormData, t,];
    var __VLS_86;
    const __VLS_93 = {}.VCol;
    ;
    VCol;
    const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({}));
    const __VLS_95 = __VLS_94({}, ...__VLS_functionalComponentArgsRest(__VLS_94));
    const { default: __VLS_97 } = __VLS_96.slots;
    const __VLS_98 = {}.VCheckbox;
    ;
    VCheckbox;
    const __VLS_99 = __VLS_asFunctionalComponent(__VLS_98, new __VLS_98({
        modelValue: (__VLS_ctx.stockFormData.firstPage),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.firstPageLabel')),
        variant: "outlined",
    }));
    const __VLS_100 = __VLS_99({
        modelValue: (__VLS_ctx.stockFormData.firstPage),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.firstPageLabel')),
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_99));
    [stockFormData, t,];
    var __VLS_96;
    var __VLS_81;
    const __VLS_103 = {}.VRow;
    ;
    VRow;
    const __VLS_104 = __VLS_asFunctionalComponent(__VLS_103, new __VLS_103({}));
    const __VLS_105 = __VLS_104({}, ...__VLS_functionalComponentArgsRest(__VLS_104));
    const { default: __VLS_107 } = __VLS_106.slots;
    const __VLS_108 = {}.VTextField;
    ;
    VTextField;
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        modelValue: (__VLS_ctx.stockFormData.url),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.urlLabel')),
        variant: "outlined",
    }));
    const __VLS_110 = __VLS_109({
        modelValue: (__VLS_ctx.stockFormData.url),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.urlLabel')),
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    [stockFormData, t,];
    var __VLS_106;
    var __VLS_51;
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ValidationService: ValidationService,
            t: t,
            stockFormData: stockFormData,
            NAME_RULES: NAME_RULES,
            ISIN_RULES: ISIN_RULES,
            onUpdateIsin: onUpdateIsin,
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
