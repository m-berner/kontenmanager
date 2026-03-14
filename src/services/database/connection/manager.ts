/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {DatabaseConnection, DatabaseMigratorContract} from "@/types";
import {appError, ERROR_DEFINITIONS} from "@/domains/errors";
import {ERROR_CATEGORY} from "@/constants";
import {log} from "@/domains/utils/utils";

/**
 * Creates a database connection manager instance.
 */
export function createDatabaseConnectionManager(
    dbName: string,
    version: number,
    migrator: DatabaseMigratorContract
): DatabaseConnection {
    let db: IDBDatabase | undefined;
    let versionChangeHandler: (() => void) | undefined;

    function resetConnection(): void {
        db = undefined;
    }

    function setupEventHandlers(database: IDBDatabase): void {
        database.onversionchange = () => {
            log(
                "DATABASE connection: version change detected",
                null,
                "warn"
            );
            database.close();
            resetConnection();

            if (versionChangeHandler) {
                versionChangeHandler();
            } else {
                // Default behavior: reload page
                window.location.reload();
            }
        };

        database.onclose = () => {
            log("DATABASE connection: closed", null, "warn");
            resetConnection();
        };
    }

    function handleConnectionSuccess(database: IDBDatabase): void {
        db = database;
        setupEventHandlers(database);
    }

    function handleConnectionError(): void {
        resetConnection();
    }

    /**
     * Establishes connection to IndexedDB
     */
    async function connect(): Promise<void> {
        if (db) {
            log("DATABASE connection: already connected", null, "warn");
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, version);

            request.onerror = () => {
                handleConnectionError();
                reject(
                    appError(
                        ERROR_DEFINITIONS.SERVICES.DATABASE.A.CODE,
                        ERROR_CATEGORY.DATABASE,
                        false,
                        {dbName, version}
                    )
                );
            };

            request.onsuccess = () => {
                handleConnectionSuccess(request.result);
                log("DATABASE connection: connected successfully", {
                    dbName,
                    version
                });
                resolve();
            };

            request.onupgradeneeded = (ev: IDBVersionChangeEvent) => {
                log("DATABASE connection: upgrading", {
                    oldVersion: ev.oldVersion,
                    newVersion: ev.newVersion
                });
                migrator.setupDatabase(request.result, ev);
            };
        });
    }

    /**
     * Closes database connection
     */
    async function disconnect(): Promise<void> {
        if (!db) return;

        try {
            db.close();
            log("DATABASE connection: disconnected");
        } catch (err) {
            log("DATABASE connection: disconnect error", err, "error");
        } finally {
            resetConnection();
        }
    }

    /**
     * Checks if the database is connected
     */
    function isConnected(): boolean {
        return !!db;
    }

    /**
     * Gets database instance
     * @throws {@link AppError} if not connected
     */
    function getDatabase(): IDBDatabase {
        if (!db) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.I.CODE,
                ERROR_CATEGORY.DATABASE,
                false
            );
        }
        return db;
    }

    /**
     * Registers version change handler
     */
    function onVersionChange(handler: () => void): void {
        versionChangeHandler = handler;
    }

    return {
        connect,
        disconnect,
        isConnected,
        getDatabase,
        onVersionChange
    };
}

export const DatabaseConnectionManager = {
    create: createDatabaseConnectionManager
};

