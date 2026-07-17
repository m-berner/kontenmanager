/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AccountDb} from "@/domain/types/domain";

/**
 * Account data for UI display in lists or summaries.
 */
export interface AccountEntry {
    /** Unique identifier. */
    id: number;
    /** Display name or IBAN. */
    name: string;
    /** Current balance or sum. */
    sum: number;
    /** CSS class for name styling. */
    nameClass: string;
    /** CSS class for sum styling (e.g., green/red). */
    sumClass: string;
}

/**
 * Data structure used in account creation/update forms.
 */

// Re-exported from "@/domain/types/ui".

/**
 * Represents the properties for the AccountForm component.
 */
export interface AccountFormProps {
    /** Indicates whether the form is being used for updating an existing account.
     * If true, the form is rendered in update mode; otherwise, it is in creation mode.
     */
    isUpdate: boolean;
}

/**
 * Interface for the account data store.
 */
export type AccountStoreContract = {
    /** List of all accounts currently in the store. */
    items: AccountStoreItem[];
    /** Resets the account store. */
    clean: () => void;
    /** Adds an account to the store. */
    add: (_account: AccountStoreItem, _prepend?: boolean) => void;
};

/**
 * Represents an account store item that extends the functionalities of the {@link AccountDb} interface.
 * This interface is used to define the structure for items stored in the account data storage system.
 * It inherits all properties and methods from the {@link AccountDb} interface.
 */
export interface AccountStoreItem extends AccountDb {
}
