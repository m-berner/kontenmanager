/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {RepositoryType, RepositoryMap} from "@/types";
import type {TransactionManager} from "../transaction/manager";
import {AccountRepository} from "./account";
import {BookingRepository} from "./booking";
import {BookingTypeRepository} from "./bookingType";
import {StockRepository} from "./stock";

/**
 * Factory for creating repository instances
 * Uses the singleton pattern for repository instances (per factory)
 */
export class RepositoryFactory {
    private readonly transactionManager: TransactionManager;
    private repositories: Partial<RepositoryMap> = {};

    constructor(transactionManager: TransactionManager) {
        this.transactionManager = transactionManager;
    }

    /**
     * Gets or creates a repository instance
     */
    getRepository<T extends RepositoryType>(type: T): RepositoryMap[T] {
        if (!this.repositories[type]) {
            this.repositories[type] = this.createRepository(type);
        }
        return this.repositories[type] as RepositoryMap[T];
    }

    /**
     * Gets all repositories
     */
    getAllRepositories(): RepositoryMap {
        return {
            accounts: this.getRepository("accounts"),
            bookings: this.getRepository("bookings"),
            bookingTypes: this.getRepository("bookingTypes"),
            stocks: this.getRepository("stocks")
        };
    }

    /**
     * Creates a new repository instance
     */
    private createRepository<T extends RepositoryType>(
        type: T
    ): RepositoryMap[T] {
        switch (type) {
            case "accounts":
                return new AccountRepository(
                    this.transactionManager
                ) as RepositoryMap[T];
            case "bookings":
                return new BookingRepository(
                    this.transactionManager
                ) as RepositoryMap[T];
            case "bookingTypes":
                return new BookingTypeRepository(
                    this.transactionManager
                ) as RepositoryMap[T];
            case "stocks":
                return new StockRepository(this.transactionManager) as RepositoryMap[T];
            default:
                throw new Error(`Unknown repository type: ${type}`);
        }
    }

    /**
     * Clears cached repository instances
     * Useful for testing or when connection changes
     */
    clearCache(): void {
        this.repositories = {};
    }
}
