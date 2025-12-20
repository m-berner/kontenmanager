export const COMPONENTS = Object.freeze({
    TITLE_BAR: {
        LOGO: '../assets/icon64.png'
    },
    DYNAMIC_LIST: {
        TYPES: {
            MARKETS: Symbol.for('markets'),
            EXCHANGES: Symbol.for('exchanges')
        }
    },
    CHECKBOX_GRID: {
        TYPES: {
            INDEXES: Symbol.for('indexes'),
            MATERIALS: Symbol.for('materials')
        }
    },
    DIALOGS: {
        FADE_IN_STOCK: 'fadeInStock',
        ADD_ACCOUNT: 'addAccount',
        UPDATE_ACCOUNT: 'updateAccount',
        DELETE_ACCOUNT: 'deleteAccount',
        ADD_STOCK: 'addStock',
        UPDATE_STOCK: 'updateStock',
        DELETE_STOCK: 'deleteStock',
        ADD_BOOKING_TYPE: 'addBookingType',
        DELETE_BOOKING_TYPE: 'DeleteBookingType',
        UPDATE_BOOKING_TYPE: 'updateBookingType',
        ADD_BOOKING: 'addBooking',
        UPDATE_BOOKING: 'updateBooking',
        DELETE_BOOKING: 'deleteBooking',
        EXPORT_DATABASE: 'exportDatabase',
        IMPORT_DATABASE: 'importDatabase',
        SHOW_ACCOUNTING: {
            NAME: 'showAccounting',
            ALL_YEARS_ID: 1000
        },
        SHOW_DIVIDEND: 'showDividend',
        UPDATE_QUOTE: 'updateQuote',
        DELETE_ACCOUNT_CONFIRMATION: 'deleteAccountConfirmation',
        SETTING: 'setting',
        OPEN_LINK: 'openLink',
        PLACEHOLDER: {
            ACCOUNT_LOGO_URL: 'z. B. https://www.ing.de'
        }
    }
});
