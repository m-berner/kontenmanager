import { UtilsService } from '@/services/utils';
import { DEFAULTS } from '@/configurations/defaults';
import { DATE } from '@/configurations/date';
import { SESSION_STORAGE } from '@/configurations/storage';
import { useBrowser } from '@/composables/useBrowser';
export class BusinessLogicService {
    static calculateTotalSum(bookings) {
        if (bookings.length === 0)
            return 0;
        return bookings.reduce((acc, entry) => {
            const fees = (entry.cTaxDebit - entry.cTaxCredit) +
                (entry.cSourceTaxDebit - entry.cSourceTaxCredit) +
                (entry.cTransactionTaxDebit - entry.cTransactionTaxCredit) +
                (entry.cSoliDebit - entry.cSoliCredit) +
                (entry.cFeeDebit - entry.cFeeCredit);
            const result = acc + (entry.cCredit - entry.cDebit) - fees;
            return Math.round(result * 100) / 100;
        }, 0);
    }
    static calculateSumFees(bookings, year) {
        const sum = bookings
            .filter(entry => new Date(entry.cBookDate).getFullYear() === year)
            .reduce((acc, entry) => acc + (entry.cFeeCredit - entry.cFeeDebit), 0);
        return Math.round(sum * 100) / 100;
    }
    static calculateSumTaxes(bookings, year) {
        const sum = bookings
            .filter(entry => new Date(entry.cBookDate).getFullYear() === year)
            .reduce((acc, entry) => {
            return acc + (entry.cTaxCredit - entry.cTaxDebit +
                entry.cSoliCredit - entry.cSoliDebit +
                entry.cSourceTaxCredit - entry.cSourceTaxDebit +
                entry.cTransactionTaxCredit - entry.cTransactionTaxDebit);
        }, 0);
        return Math.round(sum * 100) / 100;
    }
    static aggregateBookingsPerType(bookings, bookingTypes, year) {
        return bookingTypes.map(type => {
            const sum = bookings
                .filter(entry => {
                const matchType = entry.cBookingTypeID === type.cID;
                const matchYear = year ? new Date(entry.cBookDate).getFullYear() === year : true;
                return matchType && matchYear;
            })
                .reduce((acc, entry) => acc + (entry.cCredit - entry.cDebit), 0);
            return { key: Math.round(sum * 100) / 100, value: type.cName };
        });
    }
    static async initializeRecords(storesDB, stores, messages, removeAccounts = true) {
        UtilsService.log('BusinessLogicService: initializeRecords');
        if (removeAccounts)
            stores.accounts.clean();
        stores.bookings.clean();
        stores.bookingTypes.clean();
        stores.stocks.clean();
        storesDB.accountsDB.forEach(a => stores.accounts.add(a));
        storesDB.bookingTypesDB.forEach(bt => stores.bookingTypes.add(bt));
        storesDB.stocksDB.forEach(s => stores.stocks.add({ ...s, ...DEFAULTS.STOCK_MEMORY }));
        storesDB.bookingsDB.forEach(b => stores.bookings.add(b));
        stores.bookings.items.sort((a, b) => new Date(b.cBookDate).getTime() - new Date(a.cBookDate).getTime());
        stores.stocks.add({
            cID: 0,
            cISIN: 'XX0000000000',
            cSymbol: 'XXXOO0',
            cFadeOut: 1,
            cFirstPage: 0,
            cURL: '',
            cCompany: '',
            cMeetingDay: '',
            cQuarterDay: '',
            cAccountNumberID: stores.settings.activeAccountId,
            cAskDates: DATE.ISO
        }, true);
        const { getStorage, setStorage } = useBrowser();
        const session = await getStorage([SESSION_STORAGE.HIDE_IMPORT_ALERT.key]);
        if (stores.accounts.items.length === 0 && !session[SESSION_STORAGE.HIDE_IMPORT_ALERT.key]) {
            stores.alerts.info(messages.title, messages.message, null);
            await setStorage(SESSION_STORAGE.HIDE_IMPORT_ALERT.key, true);
        }
    }
}
UtilsService.log('--- services/businessLogic.ts ---');
