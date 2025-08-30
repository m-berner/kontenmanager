/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
type TStringValidator = (_v: string) => boolean | string
type TNumberValidator = (_v: number) => boolean | string

export const useValidation = () => {
    const valIbanRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0],
            (v: string) => (v !== null && v.length < 13) || msgArray[1],
            (v: string) => v.match(/^(^[A-Z]{2}[0-9]{3,12})/g) !== null || msgArray[2]
        ]
    }
    const valNameRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0],
            (v: string) => (v !== null && v.length < 32) || msgArray[1],
            (v: string) => v.match(/[^a-zA-Z\-äöüÄÖÜ]/g) === null || msgArray[2]
        ]
    }
    const valSwiftRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0],
            (v: string) => (v !== null && v.length < 13) || msgArray[1],
            (v: string) => v.match(/[^a-zA-Z0-9]/g) === null || msgArray[2]
        ]
    }
    const valDateRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => (v !== null && v.match(/^([1-2])?[0-9]{3}-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])$/g) !== null) || msgArray[0]
        ]
    }
    const valCurrencyCodeRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0],
            (v: string) => (v !== null && v.length === 3) || msgArray[1],
            (v: string) => v.match(/[^a-zA-Z]/g) === null || msgArray[2]
        ]
    }
    const valRequiredRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0]
        ]
    }
    const valPositiveIntegerRules = (msgArray: string[]): TNumberValidator[] => {
        return [
            (v: number) => v > 0 || msgArray[0]
        ]
    }
    const valBrandNameRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0]
        ]
    }
    return {
        valIbanRules,
        valNameRules,
        valSwiftRules,
        valDateRules,
        valCurrencyCodeRules,
        valRequiredRules,
        valPositiveIntegerRules,
        valBrandNameRules
    }
}
