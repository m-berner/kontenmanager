/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {RepositoryMap, RepositoryType} from "@/types";
import {createAccountRepository} from "@/services/database/repositories/account";
import {createBookingRepository} from "@/services/database/repositories/booking";
import {createBookingTypeRepository} from "@/services/database/repositories/bookingType";
import {createStockRepository} from "@/services/database/repositories/stock";

/**
 * Factory for creating repository instances
 */
export function createRepositoryFactory(transactionManager: any) {
    let repositories: Partial<RepositoryMap> = {};

    function createRepository<T extends RepositoryType>(
        type: T
    ): RepositoryMap[T] {
        switch (type) {
            case "accounts":
                return createAccountRepository(
                    transactionManager
                ) as RepositoryMap[T];
            case "bookings":
                return createBookingRepository(
                    transactionManager
                ) as RepositoryMap[T];
            case "bookingTypes":
                return createBookingTypeRepository(
                    transactionManager
                ) as RepositoryMap[T];
            case "stocks":
                return createStockRepository(transactionManager) as RepositoryMap[T];
            default:
                throw new Error(`Unknown repository type: ${type}`);
        }
    }

    /**
     * Gets or creates a repository instance
     */
    function getRepository<T extends RepositoryType>(type: T): RepositoryMap[T] {
        if (!repositories[type]) {
            repositories[type] = createRepository(type);
        }
        return repositories[type] as RepositoryMap[T];
    }

    /**
     * Gets all repositories
     */
    function getAllRepositories(): RepositoryMap {
        return {
            accounts: getRepository("accounts"),
            bookings: getRepository("bookings"),
            bookingTypes: getRepository("bookingTypes"),
            stocks: getRepository("stocks")
        };
    }

    /**
     * Clears cached repository instances
     * Useful for testing or when connection changes
     */
    function clearCache(): void {
        repositories = {};
    }

    return {
        getRepository,
        getAllRepositories,
        clearCache
    };
}

export const RepositoryFactory = {
    create: createRepositoryFactory
};
