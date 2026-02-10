import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { useRecordsStore } from "@/stores/records";
import { useSettingsStore } from "@/stores/settings";
import { useBookingForm } from "@/composables/useForms";
import CreditDebitFieldset from "@/components/CreditDebitFieldset.vue";
import { INDEXED_DB } from "@/config/database";
import { ValidationService } from "@/services/validation";
import { DomainUtils } from "@/domains/utils";
const { t } = useI18n();
const { bookingFormData } = useBookingForm();
const { bookingTypes, stocks } = useRecordsStore();
const { markets } = useSettingsStore();
const DATE_RULES = [
    t("validators.isoDateRules.required"),
    t("validators.isoDateRules.valid")
];
const BOOKING_TYPE_RULES = [t("validators.bookingTypeRules.required")];
const RULES = [t("validators.creditDebitFieldset.onlyOnePositive")];
const creditDebitModel = computed({
    get: () => ({
        credit: bookingFormData.credit,
        debit: bookingFormData.debit
    }),
    set: (val) => {
        bookingFormData.credit = val.credit;
        bookingFormData.debit = val.debit;
    }
});
const taxModel = computed({
    get: () => ({
        credit: bookingFormData.taxCredit,
        debit: bookingFormData.taxDebit
    }),
    set: (val) => {
        bookingFormData.taxCredit = val.credit;
        bookingFormData.taxDebit = val.debit;
    }
});
const soliModel = computed({
    get: () => ({
        credit: bookingFormData.soliCredit,
        debit: bookingFormData.soliDebit
    }),
    set: (val) => {
        bookingFormData.soliCredit = val.credit;
        bookingFormData.soliDebit = val.debit;
    }
});
const sourceTaxModel = computed({
    get: () => ({
        credit: bookingFormData.sourceTaxCredit,
        debit: bookingFormData.sourceTaxDebit
    }),
    set: (val) => {
        bookingFormData.sourceTaxCredit = val.credit;
        bookingFormData.sourceTaxDebit = val.debit;
    }
});
const transactionTaxModel = computed({
    get: () => ({
        credit: bookingFormData.transactionTaxCredit,
        debit: bookingFormData.transactionTaxDebit
    }),
    set: (val) => {
        bookingFormData.transactionTaxCredit = val.credit;
        bookingFormData.transactionTaxDebit = val.debit;
    }
});
const feeModel = computed({
    get: () => ({
        credit: bookingFormData.feeCredit,
        debit: bookingFormData.feeDebit
    }),
    set: (val) => {
        bookingFormData.feeCredit = val.credit;
        bookingFormData.feeDebit = val.debit;
    }
});
const isStockBookingType = computed(() => bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.BUY ||
    bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.SELL ||
    bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND);
const isDividendType = computed(() => bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND);
const isBuySellType = computed(() => bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.BUY ||
    bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.SELL);
const isBuyType = computed(() => bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.BUY);
const isDividendSellType = computed(() => bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.SELL ||
    bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND);
const sortedStocks = computed(() => [...stocks.items].sort((a, b) => a.cCompany.localeCompare(b.cCompany)));
const sortedBookingTypes = computed(() => [
    {
        cID: INDEXED_DB.STORE.BOOKING_TYPES.NONE,
        cName: "",
        cAccountNumberID: null
    },
    ...bookingTypes.items
].sort((a, b) => a.cName.localeCompare(b.cName)));
const sortedMarkets = computed(() => [...markets].sort((a, b) => a.localeCompare(b)));
DomainUtils.log("COMPONENTS DIALOGS FORMS BookingForm: setup");
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
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
const __VLS_6 = {}.VRow;
;
VRow;
const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_10 } = __VLS_9.slots;
const __VLS_11 = {}.VCol;
;
VCol;
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
    cols: "6",
}));
const __VLS_13 = __VLS_12({
    cols: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
const { default: __VLS_15 } = __VLS_14.slots;
const __VLS_16 = {}.VTextField;
;
VTextField;
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.bookingFormData.bookDate),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.dateLabel')),
    rules: (__VLS_ctx.ValidationService.isoDateRules(__VLS_ctx.DATE_RULES)),
    autofocus: true,
    density: "compact",
    type: "date",
    variant: "outlined",
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.bookingFormData.bookDate),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.dateLabel')),
    rules: (__VLS_ctx.ValidationService.isoDateRules(__VLS_ctx.DATE_RULES)),
    autofocus: true,
    density: "compact",
    type: "date",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
[bookingFormData, t, ValidationService, DATE_RULES,];
var __VLS_14;
const __VLS_21 = {}.VCol;
;
VCol;
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({}));
const __VLS_23 = __VLS_22({}, ...__VLS_functionalComponentArgsRest(__VLS_22));
const { default: __VLS_25 } = __VLS_24.slots;
if (__VLS_ctx.isStockBookingType) {
    [isStockBookingType,];
    const __VLS_26 = {}.VSelect;
    ;
    VSelect;
    const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
        modelValue: (__VLS_ctx.bookingFormData.stockId),
        itemTitle: (__VLS_ctx.INDEXED_DB.STORE.STOCKS.FIELDS.COMPANY),
        itemValue: (__VLS_ctx.INDEXED_DB.STORE.STOCKS.FIELDS.ID),
        items: (__VLS_ctx.sortedStocks),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.stockLabel')),
        clearable: true,
        density: "compact",
        maxWidth: "300",
        variant: "outlined",
    }));
    const __VLS_28 = __VLS_27({
        modelValue: (__VLS_ctx.bookingFormData.stockId),
        itemTitle: (__VLS_ctx.INDEXED_DB.STORE.STOCKS.FIELDS.COMPANY),
        itemValue: (__VLS_ctx.INDEXED_DB.STORE.STOCKS.FIELDS.ID),
        items: (__VLS_ctx.sortedStocks),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.stockLabel')),
        clearable: true,
        density: "compact",
        maxWidth: "300",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    [bookingFormData, t, INDEXED_DB, INDEXED_DB, sortedStocks,];
}
var __VLS_24;
var __VLS_9;
const __VLS_31 = {}.VRow;
;
VRow;
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    justify: "center",
}));
const __VLS_33 = __VLS_32({
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
const { default: __VLS_35 } = __VLS_34.slots;
const __VLS_36 = {}.VCol;
;
VCol;
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    cols: "6",
}));
const __VLS_38 = __VLS_37({
    cols: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const { default: __VLS_40 } = __VLS_39.slots;
const __VLS_41 = {}.VSelect;
;
VSelect;
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    modelValue: (__VLS_ctx.bookingFormData.selected),
    itemTitle: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME),
    itemValue: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID),
    items: (__VLS_ctx.sortedBookingTypes),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.bookingTypeLabel')),
    rules: (__VLS_ctx.ValidationService.bookingTypeRules(__VLS_ctx.BOOKING_TYPE_RULES)),
    clearable: true,
    density: "compact",
    maxWidth: "300",
    variant: "outlined",
}));
const __VLS_43 = __VLS_42({
    modelValue: (__VLS_ctx.bookingFormData.selected),
    itemTitle: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME),
    itemValue: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID),
    items: (__VLS_ctx.sortedBookingTypes),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.bookingTypeLabel')),
    rules: (__VLS_ctx.ValidationService.bookingTypeRules(__VLS_ctx.BOOKING_TYPE_RULES)),
    clearable: true,
    density: "compact",
    maxWidth: "300",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
[bookingFormData, t, ValidationService, INDEXED_DB, INDEXED_DB, sortedBookingTypes, BOOKING_TYPE_RULES,];
var __VLS_39;
const __VLS_46 = {}.VCol;
;
VCol;
const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({}));
const __VLS_48 = __VLS_47({}, ...__VLS_functionalComponentArgsRest(__VLS_47));
const { default: __VLS_50 } = __VLS_49.slots;
if (__VLS_ctx.isStockBookingType) {
    [isStockBookingType,];
    const __VLS_51 = {}.VTextField;
    ;
    VTextField;
    const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
        modelValue: (__VLS_ctx.bookingFormData.count),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.countLabel')),
        ...{ class: "withoutSpinner" },
        density: "compact",
        type: "number",
        variant: "outlined",
    }));
    const __VLS_53 = __VLS_52({
        modelValue: (__VLS_ctx.bookingFormData.count),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.countLabel')),
        ...{ class: "withoutSpinner" },
        density: "compact",
        type: "number",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_52));
    [bookingFormData, t,];
}
var __VLS_49;
var __VLS_34;
const __VLS_56 = {}.VRow;
;
VRow;
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    justify: "center",
}));
const __VLS_58 = __VLS_57({
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
const { default: __VLS_60 } = __VLS_59.slots;
const __VLS_61 = {}.VCol;
;
VCol;
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    cols: "6",
}));
const __VLS_63 = __VLS_62({
    cols: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
const { default: __VLS_65 } = __VLS_64.slots;
if (__VLS_ctx.isDividendType) {
    [isDividendType,];
    const __VLS_66 = {}.VTextField;
    ;
    VTextField;
    const __VLS_67 = __VLS_asFunctionalComponent(__VLS_66, new __VLS_66({
        ref: "date-input",
        modelValue: (__VLS_ctx.bookingFormData.exDate),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.exDateLabel')),
        rules: (__VLS_ctx.ValidationService.isoDateRules(__VLS_ctx.DATE_RULES)),
        density: "compact",
        required: true,
        type: "date",
        variant: "outlined",
    }));
    const __VLS_68 = __VLS_67({
        ref: "date-input",
        modelValue: (__VLS_ctx.bookingFormData.exDate),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.exDateLabel')),
        rules: (__VLS_ctx.ValidationService.isoDateRules(__VLS_ctx.DATE_RULES)),
        density: "compact",
        required: true,
        type: "date",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_67));
    ;
    var __VLS_70 = {};
    [bookingFormData, t, ValidationService, DATE_RULES,];
    var __VLS_69;
}
var __VLS_64;
const __VLS_73 = {}.VCol;
;
VCol;
const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({}));
const __VLS_75 = __VLS_74({}, ...__VLS_functionalComponentArgsRest(__VLS_74));
const { default: __VLS_77 } = __VLS_76.slots;
if (__VLS_ctx.isBuySellType) {
    [isBuySellType,];
    const __VLS_78 = {}.VSelect;
    ;
    VSelect;
    const __VLS_79 = __VLS_asFunctionalComponent(__VLS_78, new __VLS_78({
        modelValue: (__VLS_ctx.bookingFormData.marketPlace),
        items: (__VLS_ctx.sortedMarkets),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.marketPlaceLabel')),
        density: "compact",
        maxWidth: "350",
        variant: "outlined",
    }));
    const __VLS_80 = __VLS_79({
        modelValue: (__VLS_ctx.bookingFormData.marketPlace),
        items: (__VLS_ctx.sortedMarkets),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.marketPlaceLabel')),
        density: "compact",
        maxWidth: "350",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_79));
    [bookingFormData, t, sortedMarkets,];
}
var __VLS_76;
var __VLS_59;
const __VLS_83 = {}.VRow;
;
VRow;
const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({
    justify: "center",
}));
const __VLS_85 = __VLS_84({
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_84));
const { default: __VLS_87 } = __VLS_86.slots;
;
const __VLS_88 = __VLS_asFunctionalComponent(CreditDebitFieldset, new CreditDebitFieldset({
    modelValue: (__VLS_ctx.creditDebitModel),
    legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.bookingLabel')),
    rules: ([
        (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
        (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
    ]),
}));
const __VLS_89 = __VLS_88({
    modelValue: (__VLS_ctx.creditDebitModel),
    legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.bookingLabel')),
    rules: ([
        (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
        (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
    ]),
}, ...__VLS_functionalComponentArgsRest(__VLS_88));
[t, ValidationService, ValidationService, creditDebitModel, RULES, RULES,];
var __VLS_86;
if (__VLS_ctx.isDividendSellType) {
    [isDividendSellType,];
    const __VLS_92 = {}.VRow;
    ;
    VRow;
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        justify: "center",
    }));
    const __VLS_94 = __VLS_93({
        justify: "center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    const { default: __VLS_96 } = __VLS_95.slots;
    ;
    const __VLS_97 = __VLS_asFunctionalComponent(CreditDebitFieldset, new CreditDebitFieldset({
        modelValue: (__VLS_ctx.taxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.taxLabel')),
        rules: ([
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }));
    const __VLS_98 = __VLS_97({
        modelValue: (__VLS_ctx.taxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.taxLabel')),
        rules: ([
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    [t, ValidationService, ValidationService, RULES, RULES, taxModel,];
    var __VLS_95;
}
if (__VLS_ctx.isDividendSellType) {
    [isDividendSellType,];
    const __VLS_101 = {}.VRow;
    ;
    VRow;
    const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
        justify: "center",
    }));
    const __VLS_103 = __VLS_102({
        justify: "center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_102));
    const { default: __VLS_105 } = __VLS_104.slots;
    ;
    const __VLS_106 = __VLS_asFunctionalComponent(CreditDebitFieldset, new CreditDebitFieldset({
        modelValue: (__VLS_ctx.soliModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.soliLabel')),
        rules: ([
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }));
    const __VLS_107 = __VLS_106({
        modelValue: (__VLS_ctx.soliModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.soliLabel')),
        rules: ([
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_106));
    [t, ValidationService, ValidationService, RULES, RULES, soliModel,];
    var __VLS_104;
}
if (__VLS_ctx.isDividendSellType) {
    [isDividendSellType,];
    const __VLS_110 = {}.VRow;
    ;
    VRow;
    const __VLS_111 = __VLS_asFunctionalComponent(__VLS_110, new __VLS_110({
        justify: "center",
    }));
    const __VLS_112 = __VLS_111({
        justify: "center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_111));
    const { default: __VLS_114 } = __VLS_113.slots;
    ;
    const __VLS_115 = __VLS_asFunctionalComponent(CreditDebitFieldset, new CreditDebitFieldset({
        modelValue: (__VLS_ctx.sourceTaxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.sourceTaxLabel')),
        rules: ([
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }));
    const __VLS_116 = __VLS_115({
        modelValue: (__VLS_ctx.sourceTaxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.sourceTaxLabel')),
        rules: ([
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_115));
    [t, ValidationService, ValidationService, RULES, RULES, sourceTaxModel,];
    var __VLS_113;
}
if (__VLS_ctx.isBuySellType) {
    [isBuySellType,];
    const __VLS_119 = {}.VRow;
    ;
    VRow;
    const __VLS_120 = __VLS_asFunctionalComponent(__VLS_119, new __VLS_119({
        justify: "center",
    }));
    const __VLS_121 = __VLS_120({
        justify: "center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_120));
    const { default: __VLS_123 } = __VLS_122.slots;
    ;
    const __VLS_124 = __VLS_asFunctionalComponent(CreditDebitFieldset, new CreditDebitFieldset({
        modelValue: (__VLS_ctx.feeModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.feeLabel')),
        rules: ([
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }));
    const __VLS_125 = __VLS_124({
        modelValue: (__VLS_ctx.feeModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.feeLabel')),
        rules: ([
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_124));
    [t, ValidationService, ValidationService, RULES, RULES, feeModel,];
    var __VLS_122;
}
if (__VLS_ctx.isBuyType) {
    [isBuyType,];
    const __VLS_128 = {}.VRow;
    ;
    VRow;
    const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
        justify: "center",
    }));
    const __VLS_130 = __VLS_129({
        justify: "center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
    const { default: __VLS_132 } = __VLS_131.slots;
    ;
    const __VLS_133 = __VLS_asFunctionalComponent(CreditDebitFieldset, new CreditDebitFieldset({
        modelValue: (__VLS_ctx.transactionTaxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.transactionTaxLabel')),
        rules: ([
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }));
    const __VLS_134 = __VLS_133({
        modelValue: (__VLS_ctx.transactionTaxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.transactionTaxLabel')),
        rules: ([
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.ValidationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_133));
    [t, ValidationService, ValidationService, RULES, RULES, transactionTaxModel,];
    var __VLS_131;
}
const __VLS_137 = {}.VRow;
;
VRow;
const __VLS_138 = __VLS_asFunctionalComponent(__VLS_137, new __VLS_137({
    justify: "center",
}));
const __VLS_139 = __VLS_138({
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_138));
const { default: __VLS_141 } = __VLS_140.slots;
const __VLS_142 = {}.VCol;
;
VCol;
const __VLS_143 = __VLS_asFunctionalComponent(__VLS_142, new __VLS_142({
    cols: "12",
}));
const __VLS_144 = __VLS_143({
    cols: "12",
}, ...__VLS_functionalComponentArgsRest(__VLS_143));
const { default: __VLS_146 } = __VLS_145.slots;
const __VLS_147 = {}.VTextField;
;
VTextField;
const __VLS_148 = __VLS_asFunctionalComponent(__VLS_147, new __VLS_147({
    modelValue: (__VLS_ctx.bookingFormData.description),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.descriptionLabel')),
    density: "compact",
    type: "text",
    variant: "outlined",
}));
const __VLS_149 = __VLS_148({
    modelValue: (__VLS_ctx.bookingFormData.description),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.descriptionLabel')),
    density: "compact",
    type: "text",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_148));
[bookingFormData, t,];
var __VLS_145;
var __VLS_140;
var __VLS_3;
;
var __VLS_71 = __VLS_70;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            CreditDebitFieldset: CreditDebitFieldset,
            INDEXED_DB: INDEXED_DB,
            ValidationService: ValidationService,
            t: t,
            bookingFormData: bookingFormData,
            DATE_RULES: DATE_RULES,
            BOOKING_TYPE_RULES: BOOKING_TYPE_RULES,
            RULES: RULES,
            creditDebitModel: creditDebitModel,
            taxModel: taxModel,
            soliModel: soliModel,
            sourceTaxModel: sourceTaxModel,
            transactionTaxModel: transactionTaxModel,
            feeModel: feeModel,
            isStockBookingType: isStockBookingType,
            isDividendType: isDividendType,
            isBuySellType: isBuySellType,
            isBuyType: isBuyType,
            isDividendSellType: isDividendSellType,
            sortedStocks: sortedStocks,
            sortedBookingTypes: sortedBookingTypes,
            sortedMarkets: sortedMarkets,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
