/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {exportDatabaseUsecase} from "@/app/usecases/backup";
import type {RuntimePort} from "@/app/usecases/ports";

import {INDEXED_DB} from "@/domain/constants";

import type {AlertService, BrowserService, RepositoryMap, Services} from "@/adapters/secondary/types";

type TFunction = (key: string, params?: Record<string, unknown>) => string;
type ImportExportService = Services["importExportService"];

export function useExportDatabaseDialogController(input: {
    t: TFunction;
    runtime: RuntimePort;
    services: {
        browserService: BrowserService;
        alertService: AlertService;
        importExportService: ImportExportService;
        repositories: RepositoryMap;
    };
}) {
    const prefix = new Date().toISOString().substring(0, 10);
    const filename = `${prefix}_${INDEXED_DB.CURRENT_VERSION}_${INDEXED_DB.NAME}.json`;
    const dialogText = input.t("components.dialogs.exportDatabase.text", {filename});

    async function run(): Promise<void> {
        await exportDatabaseUsecase(
            {
                repositories: input.services.repositories,
                browserService: input.services.browserService,
                importExportService: input.services.importExportService,
                runtime: input.runtime
            },
            {
                filename,
                notifyEstimatedSize: async (estimatedSizeKb) => {
                    await input.services.alertService.feedbackInfo(
                        input.t("components.dialogs.exportDatabase.largeFileTitle"),
                        input.t("components.dialogs.exportDatabase.messages.estimatedSize", {
                            size: estimatedSizeKb.toFixed(2)
                        })
                    );
                },
                confirmLargeFile: async (estimatedSizeKb) => {
                    return !!(await input.services.alertService.feedbackConfirm?.(
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
                }
            }
        );
    }

    return {filename, dialogText, run};
}
