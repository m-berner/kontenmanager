import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRuntimeStore } from "@/stores/runtime";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useAlert } from "@/composables/useAlert";
import { useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB } from "@/composables/useIndexedDB";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { ImportExportService } from "@/services/importExport";
import { DEFAULTS } from "@/config/defaults";
import { INDEXED_DB } from "@/config/database";
const { t } = useI18n();
const { handleUserNotice, manifest, writeBufferToFile } = useBrowser();
const { handleUserConfirm } = useAlert();
const { getAll: getAllAccounts } = useAccountsDB();
const { getAll: getAllBookings } = useBookingsDB();
const { getAll: getAllBookingTypes } = useBookingTypesDB();
const { getAll: getAllStocks } = useStocksDB();
const { isLoading, withLoading } = useDialogGuards();
const { resetTeleport } = useRuntimeStore();
const exportService = new ImportExportService();
const filename = computed(() => {
    const prefix = new Date().toISOString().substring(0, 10);
    return `${prefix}_${INDEXED_DB.VERSION}_${INDEXED_DB.NAME}.json`;
});
const validateExportData = (accounts, bookings, stocks, bookingTypes) => {
    const errors = [];
    if (accounts.length === 0) {
        errors.push(t("components.dialogs.exportDatabase.messages.noAccounts"));
    }
    const accountIds = new Set(accounts.map((a) => a.cID));
    const invalidBookings = bookings.filter((b) => !accountIds.has(b.cAccountNumberID));
    if (invalidBookings.length > 0) {
        errors.push(t("components.dialogs.exportDatabase.messages.invalidBookings", {
            count: invalidBookings.length
        }));
    }
    const invalidStocks = stocks.filter((s) => !accountIds.has(s.cAccountNumberID));
    if (invalidStocks.length > 0) {
        errors.push(t("components.dialogs.exportDatabase.messages.invalidStocks", {
            count: invalidStocks.length
        }));
    }
    const invalidBookingTypes = bookingTypes.filter((b) => !accountIds.has(b.cAccountNumberID));
    if (invalidBookingTypes.length > 0) {
        errors.push(t("components.dialogs.exportDatabase.messages.invalidBookingTypes", {
            count: invalidBookingTypes.length
        }));
    }
    return errors;
};
const createExportData = async () => {
    const [accounts, bookings, stocks, bookingTypes] = await Promise.all([
        getAllAccounts(),
        getAllBookings(),
        getAllStocks(),
        getAllBookingTypes()
    ]);
    const validationErrors = validateExportData(accounts, bookings, stocks, bookingTypes);
    if (validationErrors.length > 0) {
        throw new AppError(ERROR_CODES.EXPORT_DATABASE.A, ERROR_CATEGORY.DATABASE, false);
    }
    const metaData = {
        cVersion: Number.parseInt(manifest.value.version.replace(/\./g, "")),
        cDBVersion: INDEXED_DB.VERSION,
        cEngine: "indexeddb"
    };
    const dataString = exportService.stringifyDatabase(metaData, accounts, stocks, bookingTypes, bookings);
    const verification = exportService.verifyExportIntegrity(dataString);
    if (!verification.valid) {
        throw new AppError(ERROR_CODES.EXPORT_DATABASE.B, ERROR_CATEGORY.DATABASE, false);
    }
    return `\n${dataString}`;
};
const estimateExportSize = (data) => {
    return new TextEncoder().encode(data).length / 1024;
};
const onClickOk = async () => {
    DomainUtils.log("EXPORT_DATABASE: onClickOk");
    await withLoading(async () => {
        try {
            const exportData = await createExportData();
            const estimatedSize = estimateExportSize(exportData);
            if (estimatedSize > DEFAULTS.LARGE_FILE_THRESHOLD_KB) {
                const proceed = await handleUserConfirm(t("components.dialogs.exportDatabase.largeFileTitle"), [
                    t("components.dialogs.exportDatabase.messages.estimatedSize", {
                        size: estimatedSize.toFixed(2)
                    })
                ], {
                    confirm: {
                        confirmText: t("components.dialogs.exportDatabase.continue"),
                        cancelText: t("components.dialogs.exportDatabase.cancel"),
                        type: "warning"
                    }
                });
                if (!proceed) {
                    return;
                }
            }
            else {
                await handleUserNotice(t("components.dialogs.exportDatabase.largeFileTitle"), "ExportDatabase");
            }
            await writeBufferToFile(exportData, filename.value);
            resetTeleport();
        }
        catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError(ERROR_CODES.EXPORT_DATABASE.C, ERROR_CATEGORY.DATABASE, true);
        }
    });
};
const __VLS_exposed = {
    onClickOk,
    title: t("components.dialogs.exportDatabase.title")
};
defineExpose(__VLS_exposed);
DomainUtils.log("COMPONENTS DIALOGS ExportDatabase: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VForm;
;
VForm;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSubmit': {} },
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
var __VLS_7 = {};
const { default: __VLS_8 } = __VLS_3.slots;
const __VLS_9 = {}.VCard;
;
VCard;
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({}));
const __VLS_11 = __VLS_10({}, ...__VLS_functionalComponentArgsRest(__VLS_10));
const { default: __VLS_13 } = __VLS_12.slots;
const __VLS_14 = {}.VCardText;
;
VCardText;
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
    ...{ class: "pa-5" },
}));
const __VLS_16 = __VLS_15({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_18 } = __VLS_17.slots;
const __VLS_19 = {}.VTextarea;
;
VTextarea;
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    disabled: (true),
    modelValue: (__VLS_ctx.t('components.dialogs.exportDatabase.text', { filename: __VLS_ctx.filename })),
    variant: "outlined",
}));
const __VLS_21 = __VLS_20({
    disabled: (true),
    modelValue: (__VLS_ctx.t('components.dialogs.exportDatabase.text', { filename: __VLS_ctx.filename })),
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
[t, filename,];
var __VLS_17;
var __VLS_12;
const __VLS_24 = {}.VOverlay;
;
VOverlay;
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_26 = __VLS_25({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const { default: __VLS_28 } = __VLS_27.slots;
[isLoading,];
const __VLS_29 = {}.VProgressCircular;
;
VProgressCircular;
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_31 = __VLS_30({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
var __VLS_27;
var __VLS_3;
;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            t: t,
            isLoading: isLoading,
            filename: filename,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
