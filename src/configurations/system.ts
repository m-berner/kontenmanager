/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
export const SYSTEM = Object.freeze(
    {
        COPYRIGHT: `2025-${new Date().getFullYear()} Martin Berner`,
        MAILTO: 'mailto:kontenmanager@gmx.de',
        HELP_URL: 'https://kontenmanager8.wixsite.com/kontenmanager',
        HTML_ENTITY:
            '(&auml|&Auml;|&ouml;|&Ouml;|&uuml;|&Uuml;|&amp;|&eacute;|&Eacute;|&ecirc;|&Ecirc;|&oacute;|&Oacute;|&aelig;|&Aelig;)',
        KEYS: {
            ENTER: 'Enter',
            TAB: 'Tab',
            T: 'T',
            V: 'V',
            Z: 'Z'
        },
        ERRORS: {
            CURR: 'Missing current record!',
            ERR: 'System error!',
            INVALID: 'Invalid Range!',
            NO_CASE: 'Missing case!',
            NO_DEL: 'Deletion off memory failed!',
            REQ: 'Request failed!',
            SRV: 'Remote Server error!',
            WRONG_PARAM: 'Wrong parameter!',
            SEND: 'Send message failed!',
            PORT: 'Message port is missing!'
        },
        ONCE: {once: true}
    }
)
