/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
export function useDebounce<T extends (..._args: any[]) => any>(
    func: T,
    delay: number
) {
    let timeoutId: NodeJS.Timeout | number

    const debouncedFunction = (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }

    const cancel = () => {
        clearTimeout(timeoutId)
    }

    return { debouncedFunction, cancel }
}
