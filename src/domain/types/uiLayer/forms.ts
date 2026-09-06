/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

export interface BaseEntity {
    cID?: number;
}

export interface BookingTypeFormProps {
    mode: FormModeType;
}

export interface StockFormProps {
    isUpdate: boolean;
}

export interface DomainValidationResult {
    isValid: boolean;
    error?: ValidationCodeType;
}

export type FormContract = {
    validate: () => Promise<FormValidateResultType>;
    resetValidation?: () => void;
};

export type FormModeType = "add" | "update" | "delete";

export type FormValidateResultType = {
    valid: boolean;
    errors?: string[];
};

export type ValidationCodeType =
    (typeof import("@/domain/constants").VALIDATION_CODES)[keyof typeof import("@/domain/constants").VALIDATION_CODES];

/**
 * The single contract for a Vuetify validation rule, and the signature every
 * function in `validationAdapter.ts` returns.
 *
 * `unknown` is deliberate and load-bearing: Vuetify hands rules the **raw model
 * value**, and a `v-text-field type="number"` supplies a *string*. Two
 * hand-written aliases used to sit in `types/uiLayer/misc.ts` declaring
 * `(_v: number)` and `(_v: string)` — unused, but better-named than this one and
 * therefore the first thing a rule author searching for the abstraction would
 * find. That assumption is exactly what made `countRules`' `typeof v ===
 * "number"` reject every share count a user typed, so no stock booking could be
 * saved at all. They were deleted rather than kept as spares; `unknown` forces
 * the narrowing that bug needed.
 */
export type ValidationRuleType = (_value: unknown) => boolean | string;
