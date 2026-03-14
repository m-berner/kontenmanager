/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    AccountDb,
    BookingDb,
    BookingTypeDb,
    HealthCheckResult,
    HealthIssue,
    HealthStats,
    RepairResult,
    RepositoryMap,
    StockDb
} from "@/types";
import {log} from "@/domains/utils/utils";
import {INDEXED_DB} from "@/constants";
import type {RepositoryFactoryContract} from "@/services/database/repositories/factory";
import type {TransactionManagerContract} from "@/services/database/transaction/manager";

/**
 * Service for database health checks and repairs
 */
export function createDatabaseHealthService(
    repositoryFactory: RepositoryFactoryContract,
    transactionManager: TransactionManagerContract
) {
    async function collectStats(): Promise<HealthStats> {
        const repos = repositoryFactory.getAllRepositories();

        // Get all data in a single transaction for consistency
        return transactionManager.execute(
            [
                INDEXED_DB.STORE.ACCOUNTS.NAME,
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.STOCKS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME
            ],
            "readonly",
            async (tx: IDBTransaction) => {
                const [accounts, bookings, stocks, bookingTypes] = await Promise.all([
                    repos.accounts.findAll({tx}),
                    repos.bookings.findAll({tx}),
                    repos.stocks.findAll({tx}),
                    repos.bookingTypes.findAll({tx})
                ]);

                const accountIds = new Set(accounts.map((a) => a.cID));

                return {
                    totalAccounts: accounts.length,
                    totalBookings: bookings.length,
                    totalStocks: stocks.length,
                    totalBookingTypes: bookingTypes.length,
                    orphanedBookings: bookings.filter(
                        (b) => !accountIds.has(b.cAccountNumberID)
                    ).length,
                    orphanedStocks: stocks.filter(
                        (s) => !accountIds.has(s.cAccountNumberID)
                    ).length,
                    orphanedBookingTypes: bookingTypes.filter(
                        (bt) => !accountIds.has(bt.cAccountNumberID)
                    ).length
                };
            }
        );
    }

    async function detectIssues(stats: HealthStats): Promise<HealthIssue[]> {
        const issues: HealthIssue[] = [];

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

    async function removeOrphanedRecords(storeName: string): Promise<void> {
        const repos = repositoryFactory.getAllRepositories() as RepositoryMap;

        return transactionManager.execute(
            [INDEXED_DB.STORE.ACCOUNTS.NAME, storeName],
            "readwrite",
            async (tx: IDBTransaction) => {
                // Get valid account IDs
                const accounts: AccountDb[] = await repos.accounts.findAll({tx});
                const validAccountIds = new Set(accounts.map((a) => a.cID));

                // Get the repository for the store
                let repository:
                    | RepositoryMap["bookings"]
                    | RepositoryMap["stocks"]
                    | RepositoryMap["bookingTypes"]
                    | undefined;
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

                // Find and delete orphaned records
                const records = await repository.findAll({tx}) as Array<
                    BookingDb | StockDb | BookingTypeDb
                >;
                for (const record of records) {
                    if (!validAccountIds.has(record.cAccountNumberID)) {
                        await repository.delete(record.cID, {tx});
                    }
                }
            }
        );
    }

    async function fixIssues(issues: HealthIssue[]): Promise<RepairResult> {
        const result: RepairResult = {
            success: true,
            fixed: 0,
            errors: []
        };

        for (const issue of issues) {
            try {
                if (issue.type === "orphaned_records") {
                    await removeOrphanedRecords(issue.store);
                    result.fixed += issue.count;
                }
            } catch (err) {
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

    /**
     * Performs comprehensive health check
     */
    async function performHealthCheck(): Promise<HealthCheckResult> {
        const startTime = performance.now();

        log("DATABASE health: starting health check");

        const stats = await collectStats();
        const issues = await detectIssues(stats);

        const result: HealthCheckResult = {
            healthy: issues.length === 0,
            issues,
            stats
        };

        const duration = Math.round(performance.now() - startTime);
        log("DATABASE health: health check completed", {
            duration,
            healthy: result.healthy,
            issueCount: issues.length
        });

        return result;
    }

    /**
     * Repairs the database by fixing detected issues
     */
    async function repairDatabase(): Promise<RepairResult> {
        const startTime = performance.now();

        log("DATABASE health: starting repair");

        const healthCheck = await performHealthCheck();

        if (healthCheck.healthy) {
            log("DATABASE health: no repair needed");
            return {
                success: true,
                fixed: 0,
                errors: []
            };
        }

        const result = await fixIssues(healthCheck.issues);

        const duration = Math.round(performance.now() - startTime);
        log("DATABASE health: repair completed", {
            duration,
            fixed: result.fixed
        });

        return result;
    }

    return {
        performHealthCheck,
        repairDatabase
    };
}

export const DatabaseHealthService = {
    create: createDatabaseHealthService
};
