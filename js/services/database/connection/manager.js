import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
export class DatabaseConnectionManager {
    _dbName;
    _version;
    _migrator;
    db;
    versionChangeHandler;
    constructor(_dbName, _version, _migrator) {
        this._dbName = _dbName;
        this._version = _version;
        this._migrator = _migrator;
    }
    async connect() {
        if (this.db) {
            DomainUtils.log("DATABASE connection: already connected", null, "warn");
            return;
        }
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this._dbName, this._version);
            request.onerror = () => {
                this.handleConnectionError();
                reject(new AppError(ERROR_CODES.SERVICES.DATABASE.A, ERROR_CATEGORY.DATABASE, false, { dbName: this._dbName, version: this._version }));
            };
            request.onsuccess = () => {
                this.handleConnectionSuccess(request.result);
                DomainUtils.log("DATABASE connection: connected successfully", {
                    dbName: this._dbName,
                    version: this._version
                });
                resolve();
            };
            request.onupgradeneeded = (ev) => {
                DomainUtils.log("DATABASE connection: upgrading", {
                    oldVersion: ev.oldVersion,
                    newVersion: ev.newVersion
                });
                this._migrator.setupDatabase(request.result, ev);
            };
        });
    }
    async disconnect() {
        if (!this.db)
            return;
        try {
            this.db.close();
            DomainUtils.log("DATABASE connection: disconnected");
        }
        catch (err) {
            DomainUtils.log("DATABASE connection: disconnect error", err, "error");
        }
        finally {
            this.resetConnection();
        }
    }
    isConnected() {
        return !!this.db;
    }
    getDatabase() {
        if (!this.db) {
            throw new AppError(ERROR_CODES.SERVICES.DATABASE.BASE.I, ERROR_CATEGORY.DATABASE, false);
        }
        return this.db;
    }
    onVersionChange(handler) {
        this.versionChangeHandler = handler;
    }
    handleConnectionSuccess(db) {
        this.db = db;
        this.setupEventHandlers();
    }
    handleConnectionError() {
        this.resetConnection();
    }
    resetConnection() {
        this.db = undefined;
    }
    setupEventHandlers() {
        if (!this.db)
            return;
        this.db.onversionchange = () => {
            DomainUtils.log("DATABASE connection: version change detected", null, "warn");
            this.db.close();
            this.resetConnection();
            if (this.versionChangeHandler) {
                this.versionChangeHandler();
            }
            else {
                window.location.reload();
            }
        };
        this.db.onclose = () => {
            DomainUtils.log("DATABASE connection: closed", null, "warn");
            this.resetConnection();
        };
    }
}
