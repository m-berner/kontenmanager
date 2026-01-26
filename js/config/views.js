export const VIEWS = Object.freeze({
    ITEMS_PER_PAGE_OPTIONS: [
        {
            value: 5,
            title: '5'
        },
        {
            value: 7,
            title: '7'
        },
        {
            value: 9,
            title: '9'
        },
        {
            value: 11,
            title: '11'
        }
    ]
});
export const createDividendHeaders = (t) => Object.freeze([
    {
        title: t('components.dialogs.showDividend.yearLabel'),
        align: 'start',
        sortable: false,
        key: 'year'
    },
    {
        title: t('components.dialogs.showDividend.sumLabel'),
        align: 'start',
        sortable: false,
        key: 'sum'
    }
]);
export const createAccountingHeaders = (t) => Object.freeze([
    {
        title: t('components.dialogs.showAccounting.nameLabel'),
        align: 'start',
        sortable: false,
        key: 'name'
    },
    {
        title: t('components.dialogs.showAccounting.sumLabel'),
        align: 'start',
        sortable: false,
        key: 'sum'
    }
]);
export const createThemes = (t) => Object.freeze({
    earth: t('views.optionsIndex.themeNames.earth'),
    ocean: t('views.optionsIndex.themeNames.ocean'),
    sky: t('views.optionsIndex.themeNames.sky'),
    meadow: t('views.optionsIndex.themeNames.meadow'),
    dark: t('views.optionsIndex.themeNames.dark'),
    light: t('views.optionsIndex.themeNames.light')
});
export const createTabs = (t) => Object.freeze([
    {
        title: t('views.optionsIndex.tabs.ge'),
        id: 'register_ge'
    },
    {
        title: t('views.optionsIndex.tabs.mp'),
        id: 'register_mp'
    },
    {
        title: t('views.optionsIndex.tabs.ind'),
        id: 'register_ind'
    },
    {
        title: t('views.optionsIndex.tabs.mat'),
        id: 'register_mat'
    },
    {
        title: t('views.optionsIndex.tabs.ex'),
        id: 'register_ex'
    }
]);
export const createPrivacyContent = (t) => Object.freeze([
    {
        SUBTITLE: t('views.sheetContent.privacyContent.general.paragraphs.local.subTitle'),
        CONTENT: t('views.sheetContent.privacyContent.general.paragraphs.local.content'),
        ICON: t('views.sheetContent.privacyContent.general.paragraphs.local.icon')
    },
    {
        SUBTITLE: t('views.sheetContent.privacyContent.general.paragraphs.public.subTitle'),
        CONTENT: t('views.sheetContent.privacyContent.general.paragraphs.public.content'),
        ICON: t('views.sheetContent.privacyContent.general.paragraphs.public.icon')
    },
    {
        SUBTITLE: t('views.sheetContent.privacyContent.general.paragraphs.connection.subTitle'),
        CONTENT: t('views.sheetContent.privacyContent.general.paragraphs.connection.content'),
        ICON: t('views.sheetContent.privacyContent.general.paragraphs.connection.icon')
    }
]);
export const createHomeHeaders = (t) => Object.freeze([
    {
        title: t('views.homeContent.bookingsTable.headers.action'),
        align: 'start',
        sortable: false,
        key: 'mAction'
    },
    {
        title: t('views.homeContent.bookingsTable.headers.date'),
        align: 'start',
        sortable: false,
        key: 'cDate'
    },
    {
        title: t('views.homeContent.bookingsTable.headers.debit'),
        align: 'start',
        sortable: false,
        key: 'cDebit'
    },
    {
        title: t('views.homeContent.bookingsTable.headers.credit'),
        align: 'start',
        sortable: false,
        key: 'cCredit'
    },
    {
        title: t('views.homeContent.bookingsTable.headers.description'),
        align: 'start',
        sortable: false,
        key: 'cDescription'
    },
    {
        title: t('views.homeContent.bookingsTable.headers.bookingType'),
        align: 'start',
        sortable: false,
        key: 'cBookingType'
    }
]);
export const createHomeMenuItems = (t) => Object.freeze([
    {
        id: 'update-booking',
        title: t('views.homeContent.bookingsTable.menuItems.update'),
        icon: '$updateBooking',
        action: 'updateBooking',
        variant: 'danger'
    },
    {
        id: 'delete-booking',
        title: t('views.homeContent.bookingsTable.menuItems.delete'),
        icon: '$deleteBooking',
        action: 'deleteBooking'
    }
]);
export const createCompanyHeaders = (t) => Object.freeze([
    {
        title: t('views.companyContent.stocksTable.headers.action'),
        align: 'start',
        sortable: false,
        key: 'mAction'
    },
    {
        title: t('views.companyContent.stocksTable.headers.company'),
        align: 'start',
        sortable: true,
        key: 'cCompany'
    },
    {
        title: t('views.companyContent.stocksTable.headers.isin'),
        align: 'start',
        sortable: false,
        key: 'cISIN'
    },
    {
        title: t('views.companyContent.stocksTable.headers.qf'),
        align: 'start',
        sortable: false,
        key: 'cQuarterDay'
    },
    {
        title: t('views.companyContent.stocksTable.headers.gm'),
        align: 'start',
        sortable: false,
        key: 'cMeetingDay'
    },
    {
        title: t('views.companyContent.stocksTable.headers.portfolio'),
        align: 'start',
        sortable: true,
        key: 'mPortfolio'
    },
    {
        title: t('views.companyContent.stocksTable.headers.winLoss'),
        align: 'start',
        sortable: false,
        key: 'mEuroChange'
    },
    {
        title: t('views.companyContent.stocksTable.headers.52low'),
        align: 'start',
        sortable: false,
        key: 'mMin'
    },
    {
        title: t('views.companyContent.stocksTable.headers.rate'),
        align: 'start',
        sortable: false,
        key: 'mValue'
    },
    {
        title: t('views.companyContent.stocksTable.headers.52high'),
        align: 'start',
        sortable: false,
        key: 'mMax'
    }
]);
export const createCompanyMenuItems = (t) => Object.freeze([
    {
        id: 'update-stock',
        title: t('views.companyContent.stocksTable.menuItems.update'),
        icon: '$showCompany',
        action: 'updateStock'
    },
    {
        id: 'delete-stock',
        title: t('views.companyContent.stocksTable.menuItems.delete'),
        icon: '$deleteCompany',
        action: 'deleteStock',
        variant: 'danger'
    },
    {
        id: 'show-dividend',
        title: t('views.companyContent.stocksTable.menuItems.dividend'),
        icon: '$showDividend',
        action: 'showDividend'
    },
    {
        id: 'open-link',
        title: t('views.companyContent.stocksTable.menuItems.link'),
        icon: '$link',
        action: 'openLink'
    }
]);
