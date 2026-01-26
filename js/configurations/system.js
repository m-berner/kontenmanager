export const SYSTEM = Object.freeze({
    TITLE: 'KontenManager',
    COPYRIGHT: `2025-${new Date().getFullYear()} Martin Berner`,
    MAILTO: 'mailto:kontenmanager@gmx.de',
    HELP_URL: 'https://kontenmanager8.wixsite.com/kontenmanager',
    HTML_ENTITY: '(&auml|&Auml;|&ouml;|&Ouml;|&uuml;|&Uuml;|&amp;|&eacute;|&Eacute;|&ecirc;|&Ecirc;|&oacute;|&Oacute;|&aelig;|&Aelig;)',
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
        PORT: 'Message port is missing!',
        WRITE_BUFFER_TO_FILE: 'Write buffer to file failed',
        LOCALE5: 'Could not read the browser language',
        NOTICE: 'Notification failed',
        OPEN_OPTIONS: 'Open options page failed',
        STORAGE_LOCAL: 'Storage local API failed',
        TABS: 'Tabs API failed',
        WINDOWS: 'Windows API failed'
    },
    ERROR_CATEGORY: {
        DATABASE: 'database',
        NETWORK: 'network',
        VALIDATION: 'validation',
        BUSINESS: 'business'
    },
    ONCE: { once: true },
    VIEW_TYPE: {
        HOME: 'home',
        COMPANY: 'company',
        SETTINGS: 'settings',
        HELP: 'help',
        PRIVACY: 'privacy'
    }
});
