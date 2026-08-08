/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createExportFilename, exportDatabaseUsecase} from "@/app/usecases/backup";
import type {RuntimePort} from "@/app/usecases/ports";

import {isConfirmDialogBusyError} from "@/domain/errors";
import {log} from "@/domain/utils/utils";

import type {Adapters, AlertAdapter, BrowserAdapter, RepositoryMap} from "@/adapters/driven/types";

type TFunction = (key: string, params?: Record<string, unknown>) => string;
type ImportExportService = Adapters["importExportAdapter"];

export function useExportDatabaseDialogController(input: {
    t: TFunction;
    runtime: RuntimePort;
    services: {
        browserAdapter: BrowserAdapter;
        alertAdapter: AlertAdapter;
        importExportAdapter: ImportExportService;
        repositories: RepositoryMap;
    };
}) {
    // Delegates to `createExportFilename` rather than re-deriving the same
    // `${date}_${dbVersion}_${dbName}.json` template inline. The helper was
    // already exported, unit-tested and named in WORKFLOWS.md as the source of
    // this filename, but nothing called it. Two copies of one rule, which is
    // exactly how they drift apart (see importExportAdapter.ts's note on the
    // MAX_SIZE constants that did drift).
    const buildFilename = (): string =>
        createExportFilename(new Date().toISOString().substring(0, 10));

    // Resolved once here for display. `run()` re-derives its own (below) rather
    // than reusing this one, so the file actually written always carries the
    // date it was written on. Previously the prefix was captured when the
    // dialog opened and a dialog left open across midnight stamped the previous
    // day onto the export.
    const filename = buildFilename();
    const dialogText = input.t("components.dialogs.exportDatabase.text", {filename});

    async function run(): Promise<void> {
        const exportFilename = buildFilename();

        await exportDatabaseUsecase(
            {
                repositories: input.services.repositories,
                browserAdapter: input.services.browserAdapter,
                importExportAdapter: input.services.importExportAdapter,
                runtime: input.runtime
            },
            {
                filename: exportFilename,
                notifyEstimatedSize: async (estimatedSizeKb) => {
                    await input.services.alertAdapter.feedbackInfo(
                        input.t("components.dialogs.exportDatabase.largeFileTitle"),
                        input.t("components.dialogs.exportDatabase.messages.estimatedSize", {
                            size: estimatedSizeKb.toFixed(2)
                        })
                    );
                },
                confirmLargeFile: async (estimatedSizeKb) => {
                    // `alerts.confirm()` REJECTS rather than resolving false
                    // when a confirmation is already open, and that rejection
                    // means "not confirmed" — `useMenu.confirmDestructive`
                    // documents the contract. Unhandled, it escaped the export
                    // usecase and surfaced as an export failure for what is
                    // really just "a dialog was already up". Only that specific
                    // rejection is absorbed; a sink that could not present the
                    // confirmation at all still propagates.
                    try {
                        return !!(await input.services.alertAdapter.feedbackConfirm?.(
                            input.t("components.dialogs.exportDatabase.largeFileTitle"),
                            [
                                input.t("components.dialogs.exportDatabase.messages.toBig", {
                                    size: estimatedSizeKb.toFixed(2)
                                })
                            ],
                            {
                                confirm: {
                                    confirmText: input.t("components.dialogs.exportDatabase.continue"),
                                    cancelText: input.t("components.dialogs.exportDatabase.cancel"),
                                    type: "warning"
                                }
                            }
                        ));
                    } catch (err) {
                        if (isConfirmDialogBusyError(err)) {
                            log("COMPOSABLES useExportDialog: a confirmation is already open", err, "warn");
                            return false;
                        }
                        throw err;
                    }
                }
            }
        );
    }

    return {filename, dialogText, run};
}
