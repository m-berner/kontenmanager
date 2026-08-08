/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/domain/constants";
import {ERROR_DEFINITIONS} from "@/domain/errors";
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
} from "@/domain/types";
import {log} from "@/domain/utils/utils";
import {findReferentialIssues} from "@/domain/validation/referentialIntegrity";

import type {RepositoryFactoryContract} from "@/adapters/driven/database/repositories/repositoryFactory";
import type {TransactionManagerContract} from "@/adapters/driven/database/transactionManager";

/**
 * Service for database health checks and repairs.
 *
 * **Intentionally not wired into any app flow.** `databaseAdapter` exposes
 * `healthCheck()` and `repairDatabase()` and `database/README.md` documents
 * both, but nothing in `src/` calls them — this is a maintenance/diagnostic
 * surface, not dead code left behind by a refactor. Recorded here so it stops
 * being re-flagged as unreachable on each audit pass.
 *
 * Two things to know before wiring either of them to a UI control:
 * - `repairDatabase()` **deletes orphaned records without confirmation**. It
 *   should sit behind an explicit, clearly-worded user action.
 * - The counts reported by `performHealthCheck()` come from a separate earlier
 *   transaction than the deletion, so they can disagree if another context
 *   mutates the database in between; `fixIssues` already reports the actual
 *   deleted count rather than the surveyed one.
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

                // Surveyed with the shared `findReferentialIssues`, the same
                // function the import validator and the export path use. This
                // check used to derive orphans from a single criterion —
                // `!accountIds.has(record.cAccountNumberID)` — and so reported
                // `healthy: true` for a database the import would refuse to take
                // back. See `domain/validation/referentialIntegrity`.
                const issues = findReferentialIssues({
                    accounts,
                    bookings,
                    stocks,
                    bookingTypes
                });

                return {
                    totalAccounts: accounts.length,
                    totalBookings: bookings.length,
                    totalStocks: stocks.length,
                    totalBookingTypes: bookingTypes.length,
                    orphanedBookings: issues.bookingsMissingAccount.length,
                    orphanedStocks: issues.stocksMissingAccount.length,
                    orphanedBookingTypes: issues.bookingTypesMissingAccount.length,
                    danglingStockReferences: issues.bookingsMissingStock.length,
                    danglingBookingTypeReferences: issues.bookingsMissingBookingType.length
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

        // Reported as `invalid_references`, deliberately NOT `orphaned_records`:
        // `fixIssues` repairs the latter by *deleting* the rows, and these
        // bookings must not be deleted. A booking pointing at a stock that was
        // removed still carries real amounts the user entered; the reference is
        // broken, the record is not. Surfacing it is what matters — it is
        // exactly the state that made a backup export cleanly and then fail to
        // re-import.
        if (stats.danglingStockReferences > 0) {
            issues.push({
                type: "invalid_references",
                severity: "error",
                store: INDEXED_DB.STORE.BOOKINGS.NAME,
                count: stats.danglingStockReferences,
                details: "Bookings referencing non-existent stocks"
            });
        }

        if (stats.danglingBookingTypeReferences > 0) {
            issues.push({
                type: "invalid_references",
                severity: "error",
                store: INDEXED_DB.STORE.BOOKINGS.NAME,
                count: stats.danglingBookingTypeReferences,
                details: "Bookings referencing non-existent booking types"
            });
        }

        return issues;
    }

    async function removeOrphanedRecords(storeName: string): Promise<number> {
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
                        return 0;
                }

                // Find and delete orphaned records
                const records = await repository.findAll({tx}) as Array<
                    BookingDb | StockDb | BookingTypeDb
                >;
                let deleted = 0;
                for (const record of records) {
                    if (!validAccountIds.has(record.cAccountNumberID)) {
                        await repository.delete(record.cID, {tx});
                        deleted++;
                    }
                }
                return deleted;
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
                    // Use the actual deleted count, not the count collected
                    // by an earlier, separate collectStats() pass — another
                    // tab/context could mutate the DB between that snapshot
                    // and this deletion, making them disagree.
                    result.fixed += await removeOrphanedRecords(issue.store);
                }
                // `invalid_references` is deliberately not handled here. The
                // only repair this service knows is deletion, and a booking
                // whose stock or booking type was removed still holds real
                // amounts — dropping it would destroy user data to satisfy a
                // constraint. These issues are reported so a human can decide;
                // `repairDatabase` therefore returns success with them still
                // present, which is the honest outcome.
            } catch (err) {
                result.success = false;
                result.errors.push({
                    issue: issue.type,
                    store: issue.store,
                    error: err instanceof Error ? err.message : ERROR_DEFINITIONS.UNKNOWN_ERROR.MSG
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