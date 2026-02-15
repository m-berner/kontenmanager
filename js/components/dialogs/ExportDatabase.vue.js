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
import { DEFAULTS } from "@/configs/defaults";
import { INDEXED_DB } from "@/configs/database";
const { t } = useI18n();
const { showSystemNotification, manifest, writeBufferToFile } = useBrowser();
const { handleUserConfirm, handleUserError } = useAlert();
const { getAll: getAllAccounts } = useAccountsDB();
const { getAll: getAllBookings } = useBookingsDB();
const { getAll: getAllBookingTypes } = useBookingTypesDB();
const { getAll: getAllStocks } = useStocksDB();
const { isLoading, withLoading } = useDialogGuards();
const { resetTeleport } = useRuntimeStore();
const exportService = new ImportExportService();
const filename = computed(() => {
    const prefix = new Date().toISOString().substring(0, 10);
    return `${prefix}_${INDEXED_DB.CURRENT_VERSION}_${INDEXED_DB.NAME}.json`;
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
        cDBVersion: INDEXED_DB.CURRENT_VERSION,
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
    DomainUtils.log("COMPONENTS DIALOGS ExportDatabase: onClickOk");
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
                await showSystemNotification(t("components.dialogs.exportDatabase.largeFileTitle"), "ExportDatabase");
            }
            await writeBufferToFile(exportData, filename.value);
            resetTeleport();
        }
        catch (err) {
            await handleUserError(t("components.dialogs.exportDatabase.title"), err, {
                data: "EXPORT_DATABASE"
            });
        }
    });
};
const __VLS_exposed = {
    onClickOk,
    title: t("components.dialogs.exportDatabase.title")
};
defineExpose(__VLS_exposed);
DomainUtils.log("COMPONENTS DIALOGS ExportDatabase: setup");
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vForm;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onSubmit': {} },
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
var __VLS_7 = {};
const { default: __VLS_8 } = __VLS_3.slots;
let __VLS_9;
vCard;
const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({}));
const __VLS_11 = __VLS_10({}, ...__VLS_functionalComponentArgsRest(__VLS_10));
const { default: __VLS_14 } = __VLS_12.slots;
let __VLS_15;
vCardText;
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    ...{ class: "pa-5" },
}));
const __VLS_17 = __VLS_16({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
;
const { default: __VLS_20 } = __VLS_18.slots;
let __VLS_21;
vTextarea;
const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
    disabled: (true),
    modelValue: (__VLS_ctx.t('components.dialogs.exportDatabase.text', { filename: __VLS_ctx.filename })),
    variant: "outlined",
}));
const __VLS_23 = __VLS_22({
    disabled: (true),
    modelValue: (__VLS_ctx.t('components.dialogs.exportDatabase.text', { filename: __VLS_ctx.filename })),
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
[t, filename,];
var __VLS_18;
[];
var __VLS_12;
let __VLS_26;
vOverlay;
const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_28 = __VLS_27({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
;
;
const { default: __VLS_31 } = __VLS_29.slots;
let __VLS_32;
vProgressCircular;
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_34 = __VLS_33({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
[isLoading,];
var __VLS_29;
[];
var __VLS_3;
var __VLS_4;
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
