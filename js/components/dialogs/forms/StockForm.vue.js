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
vContainer;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
vRow;
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
let __VLS_12;
vTextField;
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.stockFormData.isin),
    counter: (12),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.isinLabel')),
    rules: (__VLS_ctx.ValidationService.isinRules(__VLS_ctx.ISIN_RULES)),
    autofocus: true,
    variant: "outlined",
}));
const __VLS_14 = __VLS_13({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.stockFormData.isin),
    counter: (12),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.isinLabel')),
    rules: (__VLS_ctx.ValidationService.isinRules(__VLS_ctx.ISIN_RULES)),
    autofocus: true,
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_17;
const __VLS_18 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onUpdateIsin) });
var __VLS_15;
var __VLS_16;
[stockFormData, t, ValidationService, ISIN_RULES, onUpdateIsin,];
var __VLS_9;
let __VLS_19;
vRow;
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({}));
const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
const { default: __VLS_24 } = __VLS_22.slots;
let __VLS_25;
vTextField;
const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
    modelValue: (__VLS_ctx.stockFormData.company),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.companyLabel')),
    required: true,
    variant: "outlined",
}));
const __VLS_27 = __VLS_26({
    modelValue: (__VLS_ctx.stockFormData.company),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.companyLabel')),
    required: true,
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
[stockFormData, t,];
var __VLS_22;
let __VLS_30;
vRow;
const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
    cols: "2",
    sm: "2",
}));
const __VLS_32 = __VLS_31({
    cols: "2",
    sm: "2",
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
const { default: __VLS_35 } = __VLS_33.slots;
let __VLS_36;
vCol;
const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({}));
const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_41;
vCol;
const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({}));
const __VLS_43 = __VLS_42({}, ...__VLS_functionalComponentArgsRest(__VLS_42));
const { default: __VLS_46 } = __VLS_44.slots;
let __VLS_47;
vTextField;
const __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
    modelValue: (__VLS_ctx.stockFormData.symbol),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.symbolLabel')),
    rules: (__VLS_ctx.ValidationService.nameRules(__VLS_ctx.NAME_RULES)),
    required: true,
    variant: "outlined",
}));
const __VLS_49 = __VLS_48({
    modelValue: (__VLS_ctx.stockFormData.symbol),
    label: (__VLS_ctx.t('components.dialogs.forms.stockForm.symbolLabel')),
    rules: (__VLS_ctx.ValidationService.nameRules(__VLS_ctx.NAME_RULES)),
    required: true,
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
[stockFormData, t, ValidationService, NAME_RULES,];
var __VLS_44;
[];
var __VLS_33;
[];
var __VLS_3;
if (props.isUpdate) {
    let __VLS_52;
    vContainer;
    const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({}));
    const __VLS_54 = __VLS_53({}, ...__VLS_functionalComponentArgsRest(__VLS_53));
    const { default: __VLS_57 } = __VLS_55.slots;
    let __VLS_58;
    vRow;
    const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
        cols: "2",
        sm: "2",
    }));
    const __VLS_60 = __VLS_59({
        cols: "2",
        sm: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_59));
    const { default: __VLS_63 } = __VLS_61.slots;
    let __VLS_64;
    vCol;
    const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({}));
    const __VLS_66 = __VLS_65({}, ...__VLS_functionalComponentArgsRest(__VLS_65));
    const { default: __VLS_69 } = __VLS_67.slots;
    let __VLS_70;
    vTextField;
    const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
        modelValue: (__VLS_ctx.stockFormData.meetingDay),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.meetingDayLabel')),
        type: "date",
        variant: "outlined",
    }));
    const __VLS_72 = __VLS_71({
        modelValue: (__VLS_ctx.stockFormData.meetingDay),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.meetingDayLabel')),
        type: "date",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_71));
    [stockFormData, t,];
    var __VLS_67;
    let __VLS_75;
    vCol;
    const __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({}));
    const __VLS_77 = __VLS_76({}, ...__VLS_functionalComponentArgsRest(__VLS_76));
    const { default: __VLS_80 } = __VLS_78.slots;
    let __VLS_81;
    vTextField;
    const __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81({
        modelValue: (__VLS_ctx.stockFormData.quarterDay),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.quarterDayLabel')),
        type: "date",
        variant: "outlined",
    }));
    const __VLS_83 = __VLS_82({
        modelValue: (__VLS_ctx.stockFormData.quarterDay),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.quarterDayLabel')),
        type: "date",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_82));
    [stockFormData, t,];
    var __VLS_78;
    [];
    var __VLS_61;
    let __VLS_86;
    vRow;
    const __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
        cols: "2",
        sm: "2",
    }));
    const __VLS_88 = __VLS_87({
        cols: "2",
        sm: "2",
    }, ...__VLS_functionalComponentArgsRest(__VLS_87));
    const { default: __VLS_91 } = __VLS_89.slots;
    let __VLS_92;
    vCol;
    const __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({}));
    const __VLS_94 = __VLS_93({}, ...__VLS_functionalComponentArgsRest(__VLS_93));
    const { default: __VLS_97 } = __VLS_95.slots;
    let __VLS_98;
    vCheckbox;
    const __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98({
        modelValue: (__VLS_ctx.stockFormData.fadeOut),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.fadeOutLabel')),
        variant: "outlined",
    }));
    const __VLS_100 = __VLS_99({
        modelValue: (__VLS_ctx.stockFormData.fadeOut),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.fadeOutLabel')),
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_99));
    [stockFormData, t,];
    var __VLS_95;
    let __VLS_103;
    vCol;
    const __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103({}));
    const __VLS_105 = __VLS_104({}, ...__VLS_functionalComponentArgsRest(__VLS_104));
    const { default: __VLS_108 } = __VLS_106.slots;
    let __VLS_109;
    vCheckbox;
    const __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109({
        modelValue: (__VLS_ctx.stockFormData.firstPage),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.firstPageLabel')),
        variant: "outlined",
    }));
    const __VLS_111 = __VLS_110({
        modelValue: (__VLS_ctx.stockFormData.firstPage),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.firstPageLabel')),
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_110));
    [stockFormData, t,];
    var __VLS_106;
    [];
    var __VLS_89;
    let __VLS_114;
    vRow;
    const __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({}));
    const __VLS_116 = __VLS_115({}, ...__VLS_functionalComponentArgsRest(__VLS_115));
    const { default: __VLS_119 } = __VLS_117.slots;
    let __VLS_120;
    vTextField;
    const __VLS_121 = __VLS_asFunctionalComponent1(__VLS_120, new __VLS_120({
        modelValue: (__VLS_ctx.stockFormData.url),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.urlLabel')),
        variant: "outlined",
    }));
    const __VLS_122 = __VLS_121({
        modelValue: (__VLS_ctx.stockFormData.url),
        label: (__VLS_ctx.t('components.dialogs.forms.stockForm.urlLabel')),
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    [stockFormData, t,];
    var __VLS_117;
    [];
    var __VLS_55;
}
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
