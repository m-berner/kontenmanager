/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {useImportDatabaseDialogController} from "@/adapters/ui/composables/useImportDialog";
import type {RecordsLike} from "@/app/usecases/portAdapters";
import {INDEXED_DB} from "@/domain/constants";
import {makeAccountDb} from "@test/usecases";

function makeRecords(overrides: Partial<RecordsLike> = {}): RecordsLike {
    return {
        accounts: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
        bookingTypes: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
        bookings: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
        stocks: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
        clean: vi.fn(),
        init: vi.fn().mockResolvedValue(undefined),
        ...overrides
    };
}

function makeController(input: {
    records?: RecordsLike;
    activeAccountId?: number;
    validation?: {isValid: boolean; version: number; error?: string};
    backup?: unknown;
    integrityErrors?: string[];
    atomicImportImpl?: () => Promise<void>;
    feedbackErrorImpl?: () => Promise<void>;
} = {}) {
    const t = (key: string) => key;
    const settings = {activeAccountId: input.activeAccountId ?? -1};
    const runtime = {resetTeleport: vi.fn(), clearStocksPages: vi.fn()};
    const records = input.records ?? makeRecords();

    const feedbackError = input.feedbackErrorImpl
        ? vi.fn().mockImplementation(input.feedbackErrorImpl)
        : vi.fn().mockResolvedValue(undefined);

    const services = {
        browserAdapter: {
            getMessage: (k: string) => k,
            showSystemNotification: vi.fn().mockResolvedValue(undefined)
        },
        alertAdapter: {
            feedbackInfo: vi.fn().mockResolvedValue(undefined),
            feedbackError,
            feedbackConfirm: vi.fn().mockResolvedValue(true)
        },
        storageAdapter: () => ({setStorage: vi.fn().mockResolvedValue(undefined)}),
        importExportAdapter: {
            validateBackup: vi.fn().mockReturnValue(input.validation ?? {isValid: true, version: INDEXED_DB.CURRENT_VERSION}),
            validateDataIntegrity: vi.fn().mockReturnValue(input.integrityErrors ?? []),
            validateLegacyDataIntegrity: vi.fn().mockReturnValue(input.integrityErrors ?? []),
            readJsonFile: vi.fn().mockResolvedValue(
                input.backup ?? {
                    sm: {cVersion: 1, cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                    accounts: [makeAccountDb({cID: 1})],
                    stocks: [],
                    bookings: [],
                    bookingTypes: []
                }
            ),
            stringifyDatabase: vi.fn(),
            verifyExportIntegrity: vi.fn(),
            transformLegacyStock: vi.fn(),
            transformLegacyBooking: vi.fn()
        },
        databaseAdapter: {
            atomicImport: input.atomicImportImpl
                ? vi.fn().mockImplementation(input.atomicImportImpl)
                : vi.fn().mockResolvedValue(undefined)
        },
        fetchAdapter: {clearCache: vi.fn()}
    };

    const controller = useImportDatabaseDialogController({
        t,
        runtime,
        settings,
        records,
        services: services as unknown as Parameters<typeof useImportDatabaseDialogController>[0]["services"]
    });
    return {controller, services, records, runtime, settings};
}

function makeFile(name: string, content: string, type = "application/json"): File {
    return new File([content], name, {type});
}

describe("useImportDatabaseDialogController", () => {
    describe("file selection", () => {
        it("isFileSelected is false until a file is set", () => {
            const {controller} = makeController();
            expect(controller.isFileSelected.value).toBe(false);
        });

        it("accepts a valid .json file", async () => {
            const {controller, services} = makeController();
            const file = makeFile("backup.json", "{}");

            await controller.onChange(file);

            expect(controller.isFileSelected.value).toBe(true);
            expect(controller.fileBlob.value.size).toBe(file.size);
            expect(services.browserAdapter.showSystemNotification).not.toHaveBeenCalled();
        });

        it("accepts the first file when given an array", async () => {
            const {controller} = makeController();
            const file = makeFile("backup.json", "{}");

            await controller.onChange([file]);

            expect(controller.fileBlob.value.size).toBe(file.size);
        });

        it("rejects an empty file and resets the input", async () => {
            const {controller, services} = makeController();
            const file = makeFile("backup.json", "");

            await controller.onChange(file);

            expect(services.browserAdapter.showSystemNotification).toHaveBeenCalledTimes(1);
            expect(controller.isFileSelected.value).toBe(false);
        });

        it("rejects a file without a .json suffix and resets the input", async () => {
            const {controller, services} = makeController();
            const file = makeFile("backup.txt", "{}");

            await controller.onChange(file);

            expect(services.browserAdapter.showSystemNotification).toHaveBeenCalledTimes(1);
            expect(controller.isFileSelected.value).toBe(false);
        });

        it("rejects a file larger than the configured maximum", async () => {
            const {controller, services} = makeController();
            const file = makeFile("backup.json", "x");
            Object.defineProperty(file, "size", {value: INDEXED_DB.MAX_FILE_SIZE + 1});

            await controller.onChange(file);

            expect(services.browserAdapter.showSystemNotification).toHaveBeenCalledTimes(1);
            expect(controller.isFileSelected.value).toBe(false);
        });

        it("clears the file when selection is set to null", async () => {
            const {controller} = makeController();
            await controller.onChange(makeFile("backup.json", "{}"));
            expect(controller.isFileSelected.value).toBe(true);

            await controller.onChange(null);

            expect(controller.isFileSelected.value).toBe(false);
        });

        it("resetFileInput clears file state and bumps the input key so the <input> remounts", () => {
            const {controller} = makeController();
            const keyBefore = controller.fileInputKey.value;

            controller.resetFileInput();

            expect(controller.fileInputKey.value).toBe(keyBefore + 1);
            expect(controller.files.value).toBeNull();
            expect(controller.isFileSelected.value).toBe(false);
        });
    });

    describe("runImport", () => {
        it("shows a 'no rollback' notice and skips the import when a rollback snapshot can't be taken", async () => {
            const brokenRecords = makeRecords({
                accounts: {
                    // A getter that throws simulates an unreadable/corrupt in-memory store.
                    get items(): never {
                        throw new Error("boom");
                    },
                    add: vi.fn(),
                    update: vi.fn(),
                    remove: vi.fn()
                } as unknown as RecordsLike["accounts"]
            });
            const {controller, services} = makeController({records: brokenRecords});
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.alertAdapter.feedbackInfo).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                "xx_db_no_rollback"
            );
            expect(services.databaseAdapter.atomicImport).not.toHaveBeenCalled();
        });

        it("imports successfully, resets the file input, and reports a summary", async () => {
            const {controller, services, records} = makeController();
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.databaseAdapter.atomicImport).toHaveBeenCalledTimes(1);
            expect(records.init).toHaveBeenCalledTimes(1);
            expect(controller.isFileSelected.value).toBe(false);
            expect(services.alertAdapter.feedbackInfo).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                expect.stringContaining("components.dialogs.importDatabase.messages.importInfo.account")
            );
        });

        it("asks for confirmation before importing, using a summary of the detected counts", async () => {
            const {controller, services} = makeController();
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.alertAdapter.feedbackConfirm).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.confirmImportTitle",
                expect.stringContaining("1 components.dialogs.importDatabase.messages.importInfo.account"),
                expect.any(Object)
            );
        });

        it("does not import when the user declines the confirmation", async () => {
            const {controller, services} = makeController();
            (services.alertAdapter.feedbackConfirm as ReturnType<typeof vi.fn>).mockResolvedValue(false);
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.databaseAdapter.atomicImport).not.toHaveBeenCalled();
        });

        it("reports integrity errors and does not import when the backup fails cross-reference checks", async () => {
            const {controller, services} = makeController({integrityErrors: ["orphan booking 1"]});
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.alertAdapter.feedbackError).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                ["orphan booking 1"],
                {data: {count: 1}}
            );
            expect(services.databaseAdapter.atomicImport).not.toHaveBeenCalled();
        });

        it("attempts a rollback and rethrows when the error handler itself fails", async () => {
            const {controller, services, settings} = makeController({
                activeAccountId: 7,
                atomicImportImpl: () => Promise.reject(new Error("disk full")),
                feedbackErrorImpl: () => Promise.reject(new Error("alert channel down"))
            });
            await controller.onChange(makeFile("backup.json", "{}"));

            await expect(controller.runImport()).rejects.toThrow("alert channel down");

            // The usecase itself already restored the original active account before
            // the composable's outer rollback runs a second, redundant restore pass.
            expect(settings.activeAccountId).toBe(7);
            expect(services.databaseAdapter.atomicImport).toHaveBeenCalled();
        });
    });
});