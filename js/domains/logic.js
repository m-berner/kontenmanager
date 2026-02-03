import { STORE_MEMORY } from "@/domains/config/storeMemory";
import { DATE } from "@/domains/config/date";
import { DomainUtils } from "@/domains/utils";
let hideImportAlert = false;
export class DomainLogic {
    static calculateTotalSum(bookings) {
        if (bookings.length === 0)
            return 0;
        return bookings.reduce((acc, entry) => {
            const fees = entry.cTaxDebit -
                entry.cTaxCredit +
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
            .filter((entry) => new Date(entry.cBookDate).getFullYear() === year)
            .reduce((acc, entry) => acc + (entry.cFeeCredit - entry.cFeeDebit), 0);
        return Math.round(sum * 100) / 100;
    }
    static calculateSumTaxes(bookings, year) {
        const sum = bookings
            .filter((entry) => new Date(entry.cBookDate).getFullYear() === year)
            .reduce((acc, entry) => {
            return (acc +
                (entry.cTaxCredit -
                    entry.cTaxDebit +
                    entry.cSoliCredit -
                    entry.cSoliDebit +
                    entry.cSourceTaxCredit -
                    entry.cSourceTaxDebit +
                    entry.cTransactionTaxCredit -
                    entry.cTransactionTaxDebit));
        }, 0);
        return Math.round(sum * 100) / 100;
    }
    static aggregateBookingsPerType(bookings, bookingTypes, year) {
        return bookingTypes.map((type) => {
            const sum = bookings
                .filter((entry) => {
                const matchType = entry.cBookingTypeID === type.cID;
                const matchYear = year
                    ? new Date(entry.cBookDate).getFullYear() === year
                    : true;
                return matchType && matchYear;
            })
                .reduce((acc, entry) => acc + (entry.cCredit - entry.cDebit), 0);
            return { key: Math.round(sum * 100) / 100, value: type.cName };
        });
    }
    static calculateSumAllFees(bookings) {
        const sum = bookings.reduce((acc, entry) => acc + (entry.cFeeCredit - entry.cFeeDebit), 0);
        return Math.round(sum * 100) / 100;
    }
    static calculateSumAllTaxes(bookings) {
        const sum = bookings.reduce((acc, entry) => {
            return (acc +
                (entry.cTaxCredit -
                    entry.cTaxDebit +
                    entry.cSoliCredit -
                    entry.cSoliDebit +
                    entry.cSourceTaxCredit -
                    entry.cSourceTaxDebit +
                    entry.cTransactionTaxCredit -
                    entry.cTransactionTaxDebit));
        }, 0);
        return Math.round(sum * 100) / 100;
    }
    static calculatePortfolioByStockId(bookings, stockId) {
        return bookings.reduce((acc, entry) => {
            if (entry.cStockID === stockId) {
                if (entry.cBookingTypeID === 1)
                    return acc + entry.cCount;
                if (entry.cBookingTypeID === 2)
                    return acc - entry.cCount;
            }
            return acc;
        }, 0);
    }
    static calculateInvestByStockId(bookings, stockId) {
        const totalPortfolio = this.calculatePortfolioByStockId(bookings, stockId);
        let runningCount = 0;
        return bookings
            .filter((entry) => entry.cStockID === stockId && entry.cBookingTypeID === 1)
            .reduce((acc, entry) => {
            runningCount += entry.cCount;
            return runningCount <= totalPortfolio ? acc + entry.cDebit : acc;
        }, 0);
    }
    static calculateTotalDepotValue(stocks) {
        const sum = stocks.reduce((acc, rec) => {
            if (rec.mPortfolio !== undefined && rec.mPortfolio >= 0.1) {
                return acc + rec.mPortfolio * (rec.mValue ?? 0);
            }
            return acc;
        }, 0);
        return Math.round(sum * 100) / 100;
    }
    static async initializeRecords(storesDB, stores, messages, removeAccounts = true) {
        if (removeAccounts)
            stores.accounts.clean();
        stores.bookings.clean();
        stores.bookingTypes.clean();
        stores.stocks.clean();
        storesDB.accountsDB.forEach((a) => stores.accounts.add(a));
        storesDB.bookingTypesDB.forEach((bt) => stores.bookingTypes.add(bt));
        storesDB.stocksDB.forEach((s) => stores.stocks.add({ ...s, ...STORE_MEMORY.STOCK }));
        storesDB.bookingsDB.forEach((b) => stores.bookings.add(b));
        stores.bookings.items.sort((a, b) => new Date(b.cBookDate).getTime() - new Date(a.cBookDate).getTime());
        stores.stocks.add({
            cID: 0,
            cISIN: "XX0000000000",
            cSymbol: "XXXOO0",
            cFadeOut: 1,
            cFirstPage: 0,
            cURL: "",
            cCompany: "",
            cMeetingDay: "",
            cQuarterDay: "",
            cAccountNumberID: stores.settings.activeAccountId,
            cAskDates: DATE.ISO
        }, true);
        if (stores.accounts.items.length === 0 &&
            !hideImportAlert) {
            DomainUtils.log("DomainLogic.initializeRecords", messages, "info");
            hideImportAlert = true;
        }
    }
}
