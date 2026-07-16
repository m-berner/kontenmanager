/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {useExportDatabaseDialogController} from "@/adapters/ui/composables/useExportDialog";
import {INDEXED_DB} from "@/domain/constants";
import {makeAccountDb, makeBookingDb, makeBookingTypeDb, makeStockDb} from "@test/usecases";

function makeController(overrides: {
    verify?: {valid: boolean; errors: string[]};
    stringifyResult?: string;
} = {}) {
    const t = (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key;
    const runtime = {resetTeleport: vi.fn()};
    const account = makeAccountDb({cID: 1});

    const repositories = {
        accounts: {findAll: vi.fn().mockResolvedValue([account])},
        bookings: {findAll: vi.fn().mockResolvedValue([makeBookingDb({cAccountNumberID: 1})])},
        stocks: {findAll: vi.fn().mockResolvedValue([makeStockDb({cAccountNumberID: 1})])},
        bookingTypes: {findAll: vi.fn().mockResolvedValue([makeBookingTypeDb({cAccountNumberID: 1})])}
    };

    const writeBufferToFile = vi.fn().mockResolvedValue(undefined);
    const services = {
        browserAdapter: {
            manifest: () => ({version: "1.0.0"}),
            writeBufferToFile
        },
        alertAdapter: {
            feedbackInfo: vi.fn().mockResolvedValue(undefined),
            feedbackConfirm: vi.fn().mockResolvedValue(true)
        },
        importExportAdapter: {
            validateBackup: vi.fn(),
            validateDataIntegrity: vi.fn(),
            validateLegacyDataIntegrity: vi.fn(),
            readJsonFile: vi.fn(),
            stringifyDatabase: vi.fn().mockReturnValue(overrides.stringifyResult ?? "{}"),
            verifyExportIntegrity: vi.fn().mockReturnValue(overrides.verify ?? {valid: true, errors: []}),
            transformLegacyStock: vi.fn(),
            transformLegacyBooking: vi.fn()
        },
        repositories
    };

    const controller = useExportDatabaseDialogController({
        t,
        runtime,
        services: services as unknown as Parameters<typeof useExportDatabaseDialogController>[0]["services"]
    });
    return {controller, services, writeBufferToFile, runtime};
}

describe("useExportDatabaseDialogController", () => {
    it("builds a filename with today's date, the current DB version, and the DB name", () => {
        const {controller} = makeController();
        const todayPrefix = new Date().toISOString().substring(0, 10);

        expect(controller.filename).toBe(`${todayPrefix}_${INDEXED_DB.CURRENT_VERSION}_${INDEXED_DB.NAME}.json`);
    });

    it("builds dialogText from the translated key with the filename interpolated", () => {
        const {controller} = makeController();
        expect(controller.dialogText).toContain(controller.filename);
    });

    it("run() exports, writes the file, and notifies the estimated size for a normal-sized export", async () => {
        const {controller, services, writeBufferToFile} = makeController();

        await controller.run();

        expect(writeBufferToFile).toHaveBeenCalledWith(expect.any(String), controller.filename);
        expect(services.alertAdapter.feedbackInfo).toHaveBeenCalledTimes(1);
        expect(services.alertAdapter.feedbackConfirm).not.toHaveBeenCalled();
    });

    it("run() asks for confirmation instead of notifying when the export is large, and skips the write if declined", async () => {
        const {controller, services, writeBufferToFile} = makeController({
            stringifyResult: "x".repeat(11_000_000)
        });
        (services.alertAdapter.feedbackConfirm as ReturnType<typeof vi.fn>).mockResolvedValue(false);

        await controller.run();

        expect(services.alertAdapter.feedbackConfirm).toHaveBeenCalledTimes(1);
        expect(services.alertAdapter.feedbackInfo).not.toHaveBeenCalled();
        expect(writeBufferToFile).not.toHaveBeenCalled();
    });

    it("run() throws when export integrity verification fails, without writing a file", async () => {
        const {controller, writeBufferToFile} = makeController({verify: {valid: false, errors: ["bad"]}});

        await expect(controller.run()).rejects.toThrow();
        expect(writeBufferToFile).not.toHaveBeenCalled();
    });
});