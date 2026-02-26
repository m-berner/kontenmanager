/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    BookingDb,
    BookingTypeDb,
    HealthCheckResult,
    HealthIssue,
    HealthStats,
    RepairResult,
    RepositoryMap,
    StockDb
} from "@/types";
import {DomainUtils} from "@/domains/utils";
import type {RepositoryFactory} from "../repositories/factory";
import type {TransactionManager} from "../transaction/manager";
import {INDEXED_DB} from "@/configs/database";

/**
 * Service for database health checks and repairs
 */
export class DatabaseHealthService {
    private readonly repositoryFactory: RepositoryFactory;
    private readonly transactionManager: TransactionManager;

    constructor(
        repositoryFactory: RepositoryFactory,
        transactionManager: TransactionManager
    ) {
        this.repositoryFactory = repositoryFactory;
        this.transactionManager = transactionManager;
    }

    /**
     * Performs comprehensive health check
     */
    async performHealthCheck(): Promise<HealthCheckResult> {
        const startTime = performance.now();

        DomainUtils.log("DATABASE health: starting health check");

        const stats = await this.collectStats();
        const issues = await this.detectIssues(stats);

        const result: HealthCheckResult = {
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

    /**
     * Repairs the database by fixing detected issues
     */
    async repairDatabase(): Promise<RepairResult> {
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

    // Private methods

    private async collectStats(): Promise<HealthStats> {
        const repos = this.repositoryFactory.getAllRepositories();

        // Get all data in a single transaction for consistency
        return this.transactionManager.execute(
            [
                INDEXED_DB.STORE.ACCOUNTS.NAME,
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.STOCKS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME
            ],
            "readonly",
            async (tx) => {
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

    private async detectIssues(stats: HealthStats): Promise<HealthIssue[]> {
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

    private async fixIssues(issues: HealthIssue[]): Promise<RepairResult> {
        const result: RepairResult = {
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

    private async removeOrphanedRecords(storeName: string): Promise<void> {
        const repos = this.repositoryFactory.getAllRepositories() as RepositoryMap;

        return this.transactionManager.execute(
            [INDEXED_DB.STORE.ACCOUNTS.NAME, storeName],
            "readwrite",
            async (tx) => {
                // Get valid account IDs
                const accounts = await repos.accounts.findAll({tx});
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
}
