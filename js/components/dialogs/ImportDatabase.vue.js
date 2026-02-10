import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRecordsStore } from "@/stores/records";
import { useBrowser } from "@/composables/useBrowser";
import { useAlert } from "@/composables/useAlert";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { useStorage } from "@/composables/useStorage";
import { useAccountsDB } from "@/composables/useIndexedDB";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { ImportExportService } from "@/services/importExport";
import { BROWSER_STORAGE } from "@/domains/config/storage";
import { DEFAULTS } from "@/config/defaults";
import { INDEXED_DB } from "@/config/database";
import { DomainValidators } from "@/domains/validation/validators";
const { t } = useI18n();
const { getMessage, handleUserNotice } = useBrowser();
const { handleUserConfirm, handleUserError } = useAlert();
const { setStorage } = useStorage();
const { atomicImport } = useAccountsDB();
const { isLoading, withLoading } = useDialogGuards();
const { resetTeleport } = useRuntimeStore();
const settings = useSettingsStore();
const records = useRecordsStore();
const { items: accountItems } = storeToRefs(records.accounts);
const files = ref(null);
const fileBlob = ref(new Blob());
const fileInputKey = ref(0);
const importService = new ImportExportService();
const isFileSelected = computed(() => fileBlob.value.size > 0);
const resetFileInput = () => {
    fileBlob.value = new Blob();
    files.value = null;
    fileInputKey.value++;
};
const validateFile = (file) => {
    if (file.size === 0)
        return t("components.dialogs.importDatabase.messages.emptyFile");
    if (file.size > INDEXED_DB.MAX_FILE_SIZE)
        return t("components.dialogs.importDatabase.messages.fileToLarge");
    if (!file.name.endsWith(".json"))
        return t("components.dialogs.importDatabase.messages.invalidSuffix");
    return null;
};
const onChange = async (selectedFile) => {
    if (!selectedFile) {
        fileBlob.value = new Blob();
        return;
    }
    const validationError = validateFile(selectedFile);
    if (validationError) {
        await handleUserNotice(t("components.dialogs.importDatabase.title"), "Corrupt import file");
        resetFileInput();
        return;
    }
    fileBlob.value = selectedFile;
};
const createDefaultAccount = (activeId) => ({
    cID: activeId,
    cSwift: "KMKLPJJ9",
    cIban: "XX13120300001064506999",
    cLogoUrl: "",
    cWithDepot: true
});
const createDefaultBookingTypes = (activeId) => {
    const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;
    const typeMapping = [
        {
            cID: BOOKING_TYPES.BUY,
            cName: t("components.dialogs.importDatabase.buy")
        },
        {
            cID: BOOKING_TYPES.SELL,
            cName: t("components.dialogs.importDatabase.sell")
        },
        {
            cID: BOOKING_TYPES.DIVIDEND,
            cName: t("components.dialogs.importDatabase.dividend")
        },
        {
            cID: BOOKING_TYPES.CREDIT,
            cName: t("components.dialogs.importDatabase.other")
        },
        {
            cID: BOOKING_TYPES.DEBIT,
            cName: t("components.dialogs.importDatabase.fee")
        },
        {
            cID: BOOKING_TYPES.TAX,
            cName: t("components.dialogs.importDatabase.tax")
        }
    ];
    return typeMapping.map((rec) => ({
        cID: rec.cID,
        cName: rec.cName,
        cAccountNumberID: activeId
    }));
};
const toImportRecords = (data) => data.map((rec) => ({ type: "add", data: rec, key: -1 }));
const importLegacyData = async (backup, activeId) => {
    const accountsImportData = [];
    const bookingsImportData = [];
    const bookingTypesImportData = [];
    const stocksImportData = [];
    const account = createDefaultAccount(activeId);
    accountsImportData.push({ type: "add", data: account, key: -1 });
    const bookingTypes = createDefaultBookingTypes(activeId);
    for (const bt of bookingTypes) {
        bookingTypesImportData.push({ type: "add", data: bt, key: -1 });
    }
    if (backup.stocks && Array.isArray(backup.stocks)) {
        for (const rec of backup.stocks) {
            const stock = importService.transformLegacyStock(rec, activeId);
            stocksImportData.push({ type: "add", data: stock, key: -1 });
        }
    }
    if (backup.transfers) {
        for (let i = 0; i < (backup.transfers?.length ?? 0); i++) {
            const booking = importService.transformLegacyBooking(backup.transfers[i], i, activeId);
            bookingsImportData.push({
                type: "add",
                data: DomainValidators.validateBooking(booking),
                key: -1
            });
        }
    }
    await atomicImport([
        {
            storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
            operations: [{ type: "clear" }, ...accountsImportData]
        },
        {
            storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            operations: [{ type: "clear" }, ...bookingTypesImportData]
        },
        {
            storeName: INDEXED_DB.STORE.STOCKS.NAME,
            operations: [{ type: "clear" }, ...stocksImportData]
        },
        {
            storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
            operations: [{ type: "clear" }, ...bookingsImportData]
        }
    ]);
    records.init({
        accountsDB: [account],
        bookingsDB: bookingsImportData
            .map((r) => r.data)
            .filter((b) => b.cAccountNumberID === activeId),
        bookingTypesDB: bookingTypes,
        stocksDB: stocksImportData
            .map((r) => r.data)
            .filter((s) => s.cAccountNumberID === activeId)
    }, {
        title: t("mixed.smImportOnly.title"),
        message: t("mixed.smImportOnly.message")
    });
};
const importModernData = async (backup, activeId) => {
    const safeBackup = structuredClone(backup);
    safeBackup.bookings = (safeBackup.bookings || []).map((b) => DomainValidators.validateBooking(b));
    await atomicImport([
        {
            storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
            operations: [{ type: "clear" }, ...toImportRecords(safeBackup.accounts)]
        },
        {
            storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            operations: [
                { type: "clear" },
                ...toImportRecords(safeBackup.bookingTypes)
            ]
        },
        {
            storeName: INDEXED_DB.STORE.STOCKS.NAME,
            operations: [{ type: "clear" }, ...toImportRecords(safeBackup.stocks)]
        },
        {
            storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
            operations: [{ type: "clear" }, ...toImportRecords(safeBackup.bookings)]
        }
    ]);
    records.init({
        accountsDB: safeBackup.accounts,
        bookingsDB: safeBackup.bookings.filter((rec) => rec.cAccountNumberID === activeId),
        bookingTypesDB: safeBackup.bookingTypes.filter((rec) => rec.cAccountNumberID === activeId),
        stocksDB: safeBackup.stocks.filter((rec) => rec.cAccountNumberID === activeId)
    }, {
        title: t("mixed.smImportOnly.title"),
        message: t("mixed.smImportOnly.message")
    });
};
const createRollbackPoint = async () => {
    try {
        return {
            accounts: [...records.accounts.items],
            stocks: [...records.stocks.items],
            bookingTypes: [...records.bookingTypes.items],
            bookings: [...records.bookings.items],
            activeAccountId: settings.activeAccountId
        };
    }
    catch (err) {
        const errorMessage = err instanceof AppError
            ? err.message
            : err instanceof Error
                ? err.message
                : "Unknown error";
        DomainUtils.log("IMPORT_DATABASE: Failed to create rollback point", errorMessage);
        return null;
    }
};
const restoreFromRollback = async (rollbackData) => {
    try {
        DomainUtils.log("IMPORT_DATABASE: Starting rollback");
        await atomicImport([
            {
                storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
                operations: [
                    { type: "clear" },
                    ...toImportRecords(rollbackData.accounts)
                ]
            },
            {
                storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                operations: [
                    { type: "clear" },
                    ...toImportRecords(rollbackData.bookingTypes)
                ]
            },
            {
                storeName: INDEXED_DB.STORE.STOCKS.NAME,
                operations: [{ type: "clear" }, ...toImportRecords(rollbackData.stocks)]
            },
            {
                storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
                operations: [
                    { type: "clear" },
                    ...toImportRecords(rollbackData.bookings)
                ]
            }
        ]);
        settings.activeAccountId = rollbackData.activeAccountId;
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, rollbackData.activeAccountId);
        records.init({
            accountsDB: rollbackData.accounts,
            bookingsDB: rollbackData.bookings.map((b) => DomainValidators.validateBooking(b)),
            bookingTypesDB: rollbackData.bookingTypes,
            stocksDB: rollbackData.stocks
        }, {
            title: t("mixed.smImportOnly.title"),
            message: t("mixed.smImportOnly.message")
        });
        DomainUtils.log("COMPONENTS DIALOGS ImportDatabase: Rollback completed successfully");
    }
    catch (err) {
        await handleUserError(t("components.dialogs.importDatabase.title"), err, {
            data: "Rollback failed"
        });
    }
};
const getImportSummary = (backup) => {
    const isLegacy = backup.sm.cDBVersion === INDEXED_DB.SM_IMPORT_VERSION;
    if (isLegacy) {
        return [
            `1 ${t("components.dialogs.importDatabase.messages.importInfo.account")}`,
            `${backup.stocks?.length ?? 0} ${t("components.dialogs.importDatabase.messages.importInfo.stock")}`,
            `${backup.transfers?.length ?? 0} ${t("components.dialogs.importDatabase.messages.importInfo.booking")}`,
            `6 ${t("components.dialogs.importDatabase.messages.importInfo.bookingType")}`
        ].join("\n");
    }
    return [
        `${backup.accounts?.length ?? 0} ${t("components.dialogs.importDatabase.messages.importInfo.account")}`,
        `${backup.stocks?.length ?? 0} ${t("components.dialogs.importDatabase.messages.importInfo.stock")}`,
        `${backup.bookings?.length ?? 0} ${t("components.dialogs.importDatabase.messages.importInfo.booking")}`,
        `${backup.bookingTypes?.length ?? 0} ${t("components.dialogs.importDatabase.messages.importInfo.bookingType")}`
    ].join("\n");
};
const processBackupFile = async () => {
    const { activeAccountId } = storeToRefs(settings);
    const originalActiveId = activeAccountId.value;
    try {
        const backup = await ImportExportService.readJsonFile(fileBlob.value);
        const validation = ImportExportService.validateBackup(backup);
        if (!validation.isValid) {
            await handleUserError("COMPONENTS DIALOGS ImportDatabase", getMessage("xx_invalid_backup"), {});
            return;
        }
        if (validation.version === INDEXED_DB.SM_IMPORT_VERSION &&
            accountItems.value.length > 0) {
            await handleUserNotice(t("components.dialogs.importDatabase.title"), "Database imported");
            return;
        }
        let dataIntegrityErrors = [];
        if (validation.version === INDEXED_DB.SM_IMPORT_VERSION) {
            dataIntegrityErrors = importService.validateLegacyDataIntegrity(backup);
        }
        else {
            dataIntegrityErrors = importService.validateDataIntegrity(backup);
        }
        if (dataIntegrityErrors.length > 0) {
            await handleUserNotice(t("components.dialogs.importDatabase.title"), "ImportDatabase");
            resetTeleport();
            return;
        }
        const summary = getImportSummary(backup);
        const shouldProceed = await handleUserConfirm(t("components.dialogs.importDatabase.confirmImportTitle"), summary, {
            confirm: {
                confirmText: t("components.dialogs.importDatabase.confirmOk"),
                cancelText: t("components.dialogs.importDatabase.confirmCancel"),
                type: "warning"
            }
        });
        if (!shouldProceed) {
            return;
        }
        const activeId = backup.accounts?.[0].cID ?? DEFAULTS.SM_RESTORE_ACCOUNT_ID;
        activeAccountId.value = activeId;
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, activeId);
        if (backup.sm.cDBVersion === INDEXED_DB.SM_IMPORT_VERSION) {
            await importLegacyData(backup, activeId);
        }
        else if (backup.sm.cDBVersion > INDEXED_DB.SM_IMPORT_VERSION) {
            await importModernData(backup, activeId);
        }
        else {
            await handleUserNotice(t("components.dialogs.importDatabase.title"), "ImportDatabase");
            activeAccountId.value = originalActiveId;
            await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId);
            return;
        }
        resetTeleport();
        await handleUserNotice("", summary);
        resetFileInput();
    }
    catch {
        activeAccountId.value = originalActiveId;
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId);
        throw new AppError(ERROR_CODES.IMPORT_DATABASE.A, ERROR_CATEGORY.DATABASE, true);
    }
};
const onClickOk = async () => {
    DomainUtils.log("IMPORT_DATABASE: onClickOk");
    if (!isFileSelected) {
        await handleUserNotice(t("components.dialogs.importDatabase.title"), "ImportDatabase");
        return;
    }
    await withLoading(async () => {
        const rollbackData = await createRollbackPoint();
        if (!rollbackData) {
            await handleUserNotice(t("components.dialogs.importDatabase.title"), "ImportDatabase");
            return;
        }
        try {
            await processBackupFile();
        }
        catch {
            try {
                await restoreFromRollback(rollbackData);
                await handleUserNotice(t("components.dialogs.importDatabase.title"), "ImportDatabase");
            }
            catch (rollbackErr) {
                const rollbackErrorMessage = rollbackErr instanceof AppError
                    ? rollbackErr.message
                    : rollbackErr instanceof Error
                        ? rollbackErr.message
                        : "Unknown error";
                await handleUserError(t("components.dialogs.importDatabase.title"), rollbackErr, {});
                DomainUtils.log("IMPORT_DATABASE: CRITICAL - Rollback failed", rollbackErrorMessage);
            }
            throw new AppError(ERROR_CODES.IMPORT_DATABASE.B, ERROR_CATEGORY.DATABASE, true);
        }
    });
};
const __VLS_exposed = {
    onClickOk,
    title: t("components.dialogs.importDatabase.title")
};
defineExpose(__VLS_exposed);
DomainUtils.log("COMPONENTS DIALOGS ImportDatabase: setup");
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
const __VLS_9 = {}.VCardText;
;
VCardText;
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...{ class: "pa-5" },
}));
const __VLS_11 = __VLS_10({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
const { default: __VLS_13 } = __VLS_12.slots;
const __VLS_14 = {}.VTextField;
;
VTextField;
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
    label: (__VLS_ctx.t('components.dialogs.importDatabase.messageDelete')),
    readonly: true,
    variant: "plain",
}));
const __VLS_16 = __VLS_15({
    label: (__VLS_ctx.t('components.dialogs.importDatabase.messageDelete')),
    readonly: true,
    variant: "plain",
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
[t,];
const __VLS_19 = {}.VFileInput;
;
VFileInput;
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    ...{ 'onUpdate:modelValue': {} },
    key: (__VLS_ctx.fileInputKey),
    modelValue: (__VLS_ctx.files),
    clearable: (true),
    label: (__VLS_ctx.t('components.dialogs.importDatabase.fileLabel')),
    showSize: (true),
    accept: ".json",
    prependIcon: "$fileUpload",
    variant: "outlined",
}));
const __VLS_21 = __VLS_20({
    ...{ 'onUpdate:modelValue': {} },
    key: (__VLS_ctx.fileInputKey),
    modelValue: (__VLS_ctx.files),
    clearable: (true),
    label: (__VLS_ctx.t('components.dialogs.importDatabase.fileLabel')),
    showSize: (true),
    accept: ".json",
    prependIcon: "$fileUpload",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
let __VLS_23;
let __VLS_24;
const __VLS_25 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onChange) });
[t, fileInputKey, files, onChange,];
var __VLS_22;
var __VLS_12;
const __VLS_27 = {}.VOverlay;
;
VOverlay;
const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_29 = __VLS_28({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
const { default: __VLS_31 } = __VLS_30.slots;
[isLoading,];
const __VLS_32 = {}.VProgressCircular;
;
VProgressCircular;
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_34 = __VLS_33({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
var __VLS_30;
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
            files: files,
            fileInputKey: fileInputKey,
            onChange: onChange,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
