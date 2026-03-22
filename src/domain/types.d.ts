/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

export type {
    BackupData,
    BackupValidationResult,
    LegacyBackupData,
    ModernBackupData
} from "@/domain/types/backup";
export type {
    AccountDb,
    BookingDb,
    BookingTypeDb,
    LegacyBookingDb,
    LegacyStockDb,
    StockDb
} from "@/domain/types/domain";
export type {
    BatchOperationDescriptor,
    QueryOptions,
    RecordOperation,
    RecordsDbData,
    RepairResult,
    RepositoryMap,
    RepositoryType,
    RollbackData,
    StorageDataType,
    StorageValueType
} from "@/domain/types/infra";
export type {
    AccountFormData,
    BookingFormData,
    BookingTypeFormData,
    HandleUserAlertOptions,
    StockFormData
} from "@/domain/types/ui";

// Remaining UI/store/component/fetch misc types (legacy) live here for now.
export * from "@/domain/types/uiLayer";

