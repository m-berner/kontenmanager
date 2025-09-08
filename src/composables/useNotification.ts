/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {useConstant} from '@/composables/useConstant'

const {CONS} = useConstant()

export const useNotification = () => {
    const notice = async (messages: string[]): Promise<void> => {
        const msg = messages.join('\n')
        const notificationOption: browser.notifications.CreateNotificationOptions =
            {
                type: 'basic',
                iconUrl: 'assets/icon16.png',
                title: 'KontenManager',
                message: msg
            }
        await browser.notifications.create(notificationOption)
    }
    const log = (msg: string, mode?: { info?: unknown, warn?: unknown, error?: unknown }) => {
        const localDebug = localStorage.getItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG)
        if (Number.parseInt(localDebug ?? '0') > 0) {
            if (mode?.info !== undefined) {
                // eslint-disable-next-line no-console
                console.info(msg, mode?.info)
            } else if (mode?.warn !== undefined) {
                // eslint-disable-next-line no-console
                console.warn(msg, mode?.warn)
            } else if (mode?.error !== undefined) {
                // eslint-disable-next-line no-console
                console.error(msg, mode?.error)
            } else {
                // eslint-disable-next-line no-console
                console.log(msg)
            }
        }
    }
    return {
        notice,
        log
    }
}
