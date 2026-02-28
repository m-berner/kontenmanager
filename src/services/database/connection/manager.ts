/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {DatabaseConnection, DatabaseMigratorContract} from "@/types";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import {DomainUtils} from "@/domains/utils";

/**
 * Manages IndexedDB connection lifecycle
 */
export class DatabaseConnectionManager implements DatabaseConnection {
    private db?: IDBDatabase;
    private versionChangeHandler?: () => void;
    private readonly dbName: string;
    private readonly version: number;
    private readonly migrator: DatabaseMigratorContract;

    constructor(dbName: string, version: number, migrator: DatabaseMigratorContract) {
        this.dbName = dbName;
        this.version = version;
        this.migrator = migrator;
    }

    /**
     * Establishes connection to IndexedDB
     */
    async connect(): Promise<void> {
        if (this.db) {
            DomainUtils.log("DATABASE connection: already connected", null, "warn");
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                this.handleConnectionError();
                reject(
                    new AppError(
                        ERROR_CODES.SERVICES.DATABASE.A,
                        ERROR_CATEGORY.DATABASE,
                        false,
                        {dbName: this.dbName, version: this.version}
                    )
                );
            };

            request.onsuccess = () => {
                this.handleConnectionSuccess(request.result);
                DomainUtils.log("DATABASE connection: connected successfully", {
                    dbName: this.dbName,
                    version: this.version
                });
                resolve();
            };

            request.onupgradeneeded = (ev: IDBVersionChangeEvent) => {
                DomainUtils.log("DATABASE connection: upgrading", {
                    oldVersion: ev.oldVersion,
                    newVersion: ev.newVersion
                });
                this.migrator.setupDatabase(request.result, ev);
            };
        });
    }

    /**
     * Closes database connection
     */
    async disconnect(): Promise<void> {
        if (!this.db) return;

        try {
            this.db.close();
            DomainUtils.log("DATABASE connection: disconnected");
        } catch (err) {
            DomainUtils.log("DATABASE connection: disconnect error", err, "error");
        } finally {
            this.resetConnection();
        }
    }

    /**
     * Checks if the database is connected
     */
    isConnected(): boolean {
        return !!this.db;
    }

    /**
     * Gets database instance
     * @throws {AppError} if not connected
     */
    getDatabase(): IDBDatabase {
        if (!this.db) {
            throw new AppError(
                ERROR_CODES.SERVICES.DATABASE.BASE.I,
                ERROR_CATEGORY.DATABASE,
                false
            );
        }
        return this.db;
    }

    /**
     * Registers version change handler
     */
    onVersionChange(handler: () => void): void {
        this.versionChangeHandler = handler;
    }

    // Private methods

    private handleConnectionSuccess(db: IDBDatabase): void {
        this.db = db;
        this.setupEventHandlers();
    }

    private handleConnectionError(): void {
        this.resetConnection();
    }

    private resetConnection(): void {
        this.db = undefined;
    }

    private setupEventHandlers(): void {
        const db = this.db;
        if (!db) return;

        db.onversionchange = () => {
            DomainUtils.log(
                "DATABASE connection: version change detected",
                null,
                "warn"
            );
            db.close();
            this.resetConnection();

            if (this.versionChangeHandler) {
                this.versionChangeHandler();
            } else {
                // Default behavior: reload page
                window.location.reload();
            }
        };

        db.onclose = () => {
            DomainUtils.log("DATABASE connection: closed", null, "warn");
            this.resetConnection();
        };
    }
}
