import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { useRecordsStore } from "@/stores/records";
import { useSettingsStore } from "@/stores/settings";
import { useBookingForm } from "@/composables/useForms";
import CreditDebitFieldset from "@/components/CreditDebitFieldset.vue";
import { INDEXED_DB } from "@/configs/database";
import { validationService } from "@/services/validation";
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
const __VLS_ctx = {
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
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
vRow;
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
let __VLS_13;
vCol;
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    cols: "6",
}));
const __VLS_15 = __VLS_14({
    cols: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const { default: __VLS_18 } = __VLS_16.slots;
let __VLS_19;
vTextField;
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    modelValue: (__VLS_ctx.bookingFormData.bookDate),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.dateLabel')),
    rules: (__VLS_ctx.validationService.isoDateRules(__VLS_ctx.DATE_RULES)),
    autofocus: true,
    density: "compact",
    type: "date",
    variant: "outlined",
}));
const __VLS_21 = __VLS_20({
    modelValue: (__VLS_ctx.bookingFormData.bookDate),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.dateLabel')),
    rules: (__VLS_ctx.validationService.isoDateRules(__VLS_ctx.DATE_RULES)),
    autofocus: true,
    density: "compact",
    type: "date",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
[bookingFormData, t, validationService, DATE_RULES,];
var __VLS_16;
let __VLS_24;
vCol;
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const { default: __VLS_29 } = __VLS_27.slots;
if (__VLS_ctx.isStockBookingType) {
    let __VLS_30;
    vSelect;
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
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
    const __VLS_32 = __VLS_31({
        modelValue: (__VLS_ctx.bookingFormData.stockId),
        itemTitle: (__VLS_ctx.INDEXED_DB.STORE.STOCKS.FIELDS.COMPANY),
        itemValue: (__VLS_ctx.INDEXED_DB.STORE.STOCKS.FIELDS.ID),
        items: (__VLS_ctx.sortedStocks),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.stockLabel')),
        clearable: true,
        density: "compact",
        maxWidth: "300",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
}
[bookingFormData, t, isStockBookingType, INDEXED_DB, INDEXED_DB, sortedStocks,];
var __VLS_27;
[];
var __VLS_10;
let __VLS_35;
vRow;
const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
    justify: "center",
}));
const __VLS_37 = __VLS_36({
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
const { default: __VLS_40 } = __VLS_38.slots;
let __VLS_41;
vCol;
const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
    cols: "6",
}));
const __VLS_43 = __VLS_42({
    cols: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
const { default: __VLS_46 } = __VLS_44.slots;
let __VLS_47;
vSelect;
const __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
    modelValue: (__VLS_ctx.bookingFormData.selected),
    itemTitle: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME),
    itemValue: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID),
    items: (__VLS_ctx.sortedBookingTypes),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.bookingTypeLabel')),
    rules: (__VLS_ctx.validationService.bookingTypeRules(__VLS_ctx.BOOKING_TYPE_RULES)),
    clearable: true,
    density: "compact",
    maxWidth: "300",
    variant: "outlined",
}));
const __VLS_49 = __VLS_48({
    modelValue: (__VLS_ctx.bookingFormData.selected),
    itemTitle: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME),
    itemValue: (__VLS_ctx.INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID),
    items: (__VLS_ctx.sortedBookingTypes),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.bookingTypeLabel')),
    rules: (__VLS_ctx.validationService.bookingTypeRules(__VLS_ctx.BOOKING_TYPE_RULES)),
    clearable: true,
    density: "compact",
    maxWidth: "300",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
[bookingFormData, t, validationService, INDEXED_DB, INDEXED_DB, sortedBookingTypes, BOOKING_TYPE_RULES,];
var __VLS_44;
let __VLS_52;
vCol;
const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({}));
const __VLS_54 = __VLS_53({}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const { default: __VLS_57 } = __VLS_55.slots;
if (__VLS_ctx.isStockBookingType) {
    let __VLS_58;
    vTextField;
    const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
        modelValue: (__VLS_ctx.bookingFormData.count),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.countLabel')),
        ...{ class: "withoutSpinner" },
        density: "compact",
        type: "number",
        variant: "outlined",
    }));
    const __VLS_60 = __VLS_59({
        modelValue: (__VLS_ctx.bookingFormData.count),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.countLabel')),
        ...{ class: "withoutSpinner" },
        density: "compact",
        type: "number",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_59));
    ;
}
[bookingFormData, t, isStockBookingType,];
var __VLS_55;
[];
var __VLS_38;
let __VLS_63;
vRow;
const __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
    justify: "center",
}));
const __VLS_65 = __VLS_64({
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_64));
const { default: __VLS_68 } = __VLS_66.slots;
let __VLS_69;
vCol;
const __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
    cols: "6",
}));
const __VLS_71 = __VLS_70({
    cols: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
const { default: __VLS_74 } = __VLS_72.slots;
if (__VLS_ctx.isDividendType) {
    let __VLS_75;
    vTextField;
    const __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
        ref: "date-input",
        modelValue: (__VLS_ctx.bookingFormData.exDate),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.exDateLabel')),
        rules: (__VLS_ctx.validationService.isoDateRules(__VLS_ctx.DATE_RULES)),
        density: "compact",
        required: true,
        type: "date",
        variant: "outlined",
    }));
    const __VLS_77 = __VLS_76({
        ref: "date-input",
        modelValue: (__VLS_ctx.bookingFormData.exDate),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.exDateLabel')),
        rules: (__VLS_ctx.validationService.isoDateRules(__VLS_ctx.DATE_RULES)),
        density: "compact",
        required: true,
        type: "date",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
    var __VLS_80 = {};
    var __VLS_78;
}
[bookingFormData, t, validationService, DATE_RULES, isDividendType,];
var __VLS_72;
let __VLS_82;
vCol;
const __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({}));
const __VLS_84 = __VLS_83({}, ...__VLS_functionalComponentArgsRest(__VLS_83));
const { default: __VLS_87 } = __VLS_85.slots;
if (__VLS_ctx.isBuySellType) {
    let __VLS_88;
    vSelect;
    const __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
        modelValue: (__VLS_ctx.bookingFormData.marketPlace),
        items: (__VLS_ctx.sortedMarkets),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.marketPlaceLabel')),
        density: "compact",
        maxWidth: "350",
        variant: "outlined",
    }));
    const __VLS_90 = __VLS_89({
        modelValue: (__VLS_ctx.bookingFormData.marketPlace),
        items: (__VLS_ctx.sortedMarkets),
        label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.marketPlaceLabel')),
        density: "compact",
        maxWidth: "350",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
}
[bookingFormData, t, isBuySellType, sortedMarkets,];
var __VLS_85;
[];
var __VLS_66;
let __VLS_93;
vRow;
const __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93({
    justify: "center",
}));
const __VLS_95 = __VLS_94({
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_94));
const { default: __VLS_98 } = __VLS_96.slots;
const __VLS_99 = CreditDebitFieldset;
const __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
    modelValue: (__VLS_ctx.creditDebitModel),
    legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.bookingLabel')),
    rules: ([
        (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
        (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
    ]),
}));
const __VLS_101 = __VLS_100({
    modelValue: (__VLS_ctx.creditDebitModel),
    legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.bookingLabel')),
    rules: ([
        (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
        (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
    ]),
}, ...__VLS_functionalComponentArgsRest(__VLS_100));
[t, validationService, validationService, creditDebitModel, RULES, RULES,];
var __VLS_96;
if (__VLS_ctx.isDividendSellType) {
    let __VLS_104;
    vRow;
    const __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
        justify: "center",
    }));
    const __VLS_106 = __VLS_105({
        justify: "center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    const { default: __VLS_109 } = __VLS_107.slots;
    const __VLS_110 = CreditDebitFieldset;
    const __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
        modelValue: (__VLS_ctx.taxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.taxLabel')),
        rules: ([
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }));
    const __VLS_112 = __VLS_111({
        modelValue: (__VLS_ctx.taxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.taxLabel')),
        rules: ([
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_111));
    [t, validationService, validationService, RULES, RULES, isDividendSellType, taxModel,];
    var __VLS_107;
}
if (__VLS_ctx.isDividendSellType) {
    let __VLS_115;
    vRow;
    const __VLS_116 = __VLS_asFunctionalComponent1(__VLS_115, new __VLS_115({
        justify: "center",
    }));
    const __VLS_117 = __VLS_116({
        justify: "center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_116));
    const { default: __VLS_120 } = __VLS_118.slots;
    const __VLS_121 = CreditDebitFieldset;
    const __VLS_122 = __VLS_asFunctionalComponent1(__VLS_121, new __VLS_121({
        modelValue: (__VLS_ctx.soliModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.soliLabel')),
        rules: ([
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }));
    const __VLS_123 = __VLS_122({
        modelValue: (__VLS_ctx.soliModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.soliLabel')),
        rules: ([
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_122));
    [t, validationService, validationService, RULES, RULES, isDividendSellType, soliModel,];
    var __VLS_118;
}
if (__VLS_ctx.isDividendSellType) {
    let __VLS_126;
    vRow;
    const __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126({
        justify: "center",
    }));
    const __VLS_128 = __VLS_127({
        justify: "center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_127));
    const { default: __VLS_131 } = __VLS_129.slots;
    const __VLS_132 = CreditDebitFieldset;
    const __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132({
        modelValue: (__VLS_ctx.sourceTaxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.sourceTaxLabel')),
        rules: ([
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }));
    const __VLS_134 = __VLS_133({
        modelValue: (__VLS_ctx.sourceTaxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.sourceTaxLabel')),
        rules: ([
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_133));
    [t, validationService, validationService, RULES, RULES, isDividendSellType, sourceTaxModel,];
    var __VLS_129;
}
if (__VLS_ctx.isBuySellType) {
    let __VLS_137;
    vRow;
    const __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137({
        justify: "center",
    }));
    const __VLS_139 = __VLS_138({
        justify: "center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_138));
    const { default: __VLS_142 } = __VLS_140.slots;
    const __VLS_143 = CreditDebitFieldset;
    const __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
        modelValue: (__VLS_ctx.feeModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.feeLabel')),
        rules: ([
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }));
    const __VLS_145 = __VLS_144({
        modelValue: (__VLS_ctx.feeModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.feeLabel')),
        rules: ([
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_144));
    [t, validationService, validationService, isBuySellType, RULES, RULES, feeModel,];
    var __VLS_140;
}
if (__VLS_ctx.isBuyType) {
    let __VLS_148;
    vRow;
    const __VLS_149 = __VLS_asFunctionalComponent1(__VLS_148, new __VLS_148({
        justify: "center",
    }));
    const __VLS_150 = __VLS_149({
        justify: "center",
    }, ...__VLS_functionalComponentArgsRest(__VLS_149));
    const { default: __VLS_153 } = __VLS_151.slots;
    const __VLS_154 = CreditDebitFieldset;
    const __VLS_155 = __VLS_asFunctionalComponent1(__VLS_154, new __VLS_154({
        modelValue: (__VLS_ctx.transactionTaxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.transactionTaxLabel')),
        rules: ([
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }));
    const __VLS_156 = __VLS_155({
        modelValue: (__VLS_ctx.transactionTaxModel),
        legend: (__VLS_ctx.t('components.dialogs.forms.bookingForm.transactionTaxLabel')),
        rules: ([
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES),
            (v) => __VLS_ctx.validationService.amountRules(v, __VLS_ctx.RULES)
        ]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_155));
    [t, validationService, validationService, RULES, RULES, isBuyType, transactionTaxModel,];
    var __VLS_151;
}
let __VLS_159;
vRow;
const __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159({
    justify: "center",
}));
const __VLS_161 = __VLS_160({
    justify: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_160));
const { default: __VLS_164 } = __VLS_162.slots;
let __VLS_165;
vCol;
const __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165({
    cols: "12",
}));
const __VLS_167 = __VLS_166({
    cols: "12",
}, ...__VLS_functionalComponentArgsRest(__VLS_166));
const { default: __VLS_170 } = __VLS_168.slots;
let __VLS_171;
vTextField;
const __VLS_172 = __VLS_asFunctionalComponent1(__VLS_171, new __VLS_171({
    modelValue: (__VLS_ctx.bookingFormData.description),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.descriptionLabel')),
    density: "compact",
    type: "text",
    variant: "outlined",
}));
const __VLS_173 = __VLS_172({
    modelValue: (__VLS_ctx.bookingFormData.description),
    label: (__VLS_ctx.t('components.dialogs.forms.bookingForm.descriptionLabel')),
    density: "compact",
    type: "text",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_172));
[bookingFormData, t,];
var __VLS_168;
[];
var __VLS_162;
[];
var __VLS_3;
var __VLS_81 = __VLS_80;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
