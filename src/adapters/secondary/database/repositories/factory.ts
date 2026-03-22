/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {RepositoryMap, RepositoryType} from "@/domain/types";

import {createAccountRepository} from "@/adapters/secondary/database/repositories/account";
import {createBookingRepository} from "@/adapters/secondary/database/repositories/booking";
import {createBookingTypeRepository} from "@/adapters/secondary/database/repositories/bookingType";
import {createStockRepository} from "@/adapters/secondary/database/repositories/stock";
import type {TransactionManagerContract} from "@/adapters/secondary/database/transaction/manager";

/**
 * Factory for creating repository instances
 */
export function createRepositoryFactory(transactionManager: TransactionManagerContract) {
    let repositories: Partial<RepositoryMap> = {};

    const creators: { [K in RepositoryType]: () => RepositoryMap[K] } = {
        accounts: () => createAccountRepository(transactionManager),
        bookings: () => createBookingRepository(transactionManager),
        bookingTypes: () => createBookingTypeRepository(transactionManager),
        stocks: () => createStockRepository(transactionManager)
    };

    function createRepository<T extends RepositoryType>(type: T): RepositoryMap[T] {
        const create = creators[type];
        if (!create) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.J.CODE,
                ERROR_CATEGORY.DATABASE,
                false,
                {type}
            );
        }
        return create();
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

export type RepositoryFactoryContract = ReturnType<typeof createRepositoryFactory>;

export const RepositoryFactory = {
    create: createRepositoryFactory
};
