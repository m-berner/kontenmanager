import { DomainUtils } from "@/domains/utils";
import { INDEXED_DB } from "@/configs/database";
export class DatabaseHealthService {
    _repositoryFactory;
    _transactionManager;
    constructor(_repositoryFactory, _transactionManager) {
        this._repositoryFactory = _repositoryFactory;
        this._transactionManager = _transactionManager;
    }
    async performHealthCheck() {
        const startTime = performance.now();
        DomainUtils.log("DATABASE health: starting health check");
        const stats = await this.collectStats();
        const issues = await this.detectIssues(stats);
        const result = {
            healthy: issues.length === 0,
            issues,
            stats
        };
        const duration = Math.round(performance.now() - startTime);
        DomainUtils.log("DATABASE health: health check completed", {
            duration,
            healthy: result.healthy,
            issueCount: issues.length
        });
        return result;
    }
    async repairDatabase() {
        const startTime = performance.now();
        DomainUtils.log("DATABASE health: starting repair");
        const healthCheck = await this.performHealthCheck();
        if (healthCheck.healthy) {
            DomainUtils.log("DATABASE health: no repair needed");
            return {
                success: true,
                fixed: 0,
                errors: []
            };
        }
        const result = await this.fixIssues(healthCheck.issues);
        const duration = Math.round(performance.now() - startTime);
        DomainUtils.log("DATABASE health: repair completed", {
            duration,
            fixed: result.fixed
        });
        return result;
    }
    async collectStats() {
        const repos = this._repositoryFactory.getAllRepositories();
        return this._transactionManager.execute([
            INDEXED_DB.STORE.ACCOUNTS.NAME,
            INDEXED_DB.STORE.BOOKINGS.NAME,
            INDEXED_DB.STORE.STOCKS.NAME,
            INDEXED_DB.STORE.BOOKING_TYPES.NAME
        ], "readonly", async (tx) => {
            const [accounts, bookings, stocks, bookingTypes] = await Promise.all([
                repos.accounts.findAll({ tx }),
                repos.bookings.findAll({ tx }),
                repos.stocks.findAll({ tx }),
                repos.bookingTypes.findAll({ tx })
            ]);
            const accountIds = new Set(accounts.map(a => a.cID));
            return {
                totalAccounts: accounts.length,
                totalBookings: bookings.length,
                totalStocks: stocks.length,
                totalBookingTypes: bookingTypes.length,
                orphanedBookings: bookings.filter(b => !accountIds.has(b.cAccountNumberID)).length,
                orphanedStocks: stocks.filter(s => !accountIds.has(s.cAccountNumberID)).length,
                orphanedBookingTypes: bookingTypes.filter(bt => !accountIds.has(bt.cAccountNumberID)).length
            };
        });
    }
    async detectIssues(stats) {
        const issues = [];
        if (stats.orphanedBookings > 0) {
            issues.push({
                type: "orphaned_records",
                severity: "error",
                store: INDEXED_DB.STORE.BOOKINGS.NAME,
                count: stats.orphanedBookings,
                details: "Bookings referencing non-existent accounts"
            });
        }
        if (stats.orphanedStocks > 0) {
            issues.push({
                type: "orphaned_records",
                severity: "error",
                store: INDEXED_DB.STORE.STOCKS.NAME,
                count: stats.orphanedStocks,
                details: "Stocks referencing non-existent accounts"
            });
        }
        if (stats.orphanedBookingTypes > 0) {
            issues.push({
                type: "orphaned_records",
                severity: "error",
                store: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                count: stats.orphanedBookingTypes,
                details: "Booking types referencing non-existent accounts"
            });
        }
        return issues;
    }
    async fixIssues(issues) {
        const result = {
            success: true,
            fixed: 0,
            errors: []
        };
        for (const issue of issues) {
            try {
                if (issue.type === "orphaned_records") {
                    await this.removeOrphanedRecords(issue.store);
                    result.fixed += issue.count;
                }
            }
            catch (err) {
                result.success = false;
                result.errors.push({
                    issue: issue.type,
                    store: issue.store,
                    error: err instanceof Error ? err.message : "Unknown error"
                });
            }
        }
        return result;
    }
    async removeOrphanedRecords(storeName) {
        const repos = this._repositoryFactory.getAllRepositories();
        return this._transactionManager.execute([INDEXED_DB.STORE.ACCOUNTS.NAME, storeName], "readwrite", async (tx) => {
            const accounts = await repos.accounts.findAll({ tx });
            const validAccountIds = new Set(accounts.map(a => a.cID));
            let repository;
            switch (storeName) {
                case INDEXED_DB.STORE.BOOKINGS.NAME:
                    repository = repos.bookings;
                    break;
                case INDEXED_DB.STORE.STOCKS.NAME:
                    repository = repos.stocks;
                    break;
                case INDEXED_DB.STORE.BOOKING_TYPES.NAME:
                    repository = repos.bookingTypes;
                    break;
                default:
                    return;
            }
            const records = await repository.findAll({ tx });
            for (const record of records) {
                if (!validAccountIds.has(record.cAccountNumberID)) {
                    await repository.delete(record.cID, { tx });
                }
            }
        });
    }
}
