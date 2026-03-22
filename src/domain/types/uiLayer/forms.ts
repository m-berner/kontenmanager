/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {Ref, UnwrapNestedRefs} from "vue";

export interface BaseDialogForm {
    formRef: Ref<FormContract | null>;
    validateForm: () => Promise<boolean>;
}

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

export interface FormsManager<TForm, TDB, TArgs extends unknown[] = unknown[]> {
    formData: UnwrapNestedRefs<TForm>;
    reset: () => void;
    mapFormToDb: (_data: UnwrapNestedRefs<TForm>, ..._args: TArgs) => TDB;
}

export type FormValidateResultType = {
    valid: boolean;
    errors?: string[];
};

export type ValidationCodeType =
    (typeof import("@/domain/constants").VALIDATION_CODES)[keyof typeof import("@/domain/constants").VALIDATION_CODES];

export type ValidationRuleType = (_value: unknown) => boolean | string;
