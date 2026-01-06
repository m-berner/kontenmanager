import { INDEXED_DB } from '@/configurations/indexed_db';
export function useImportExport() {
    class ImportExportService {
        _INDEXED_DB;
        _DATE;
        _isoDate;
        constructor(_INDEXED_DB, _DATE, _isoDate) {
            this._INDEXED_DB = _INDEXED_DB;
            this._DATE = _DATE;
            this._isoDate = _isoDate;
        }
        verifyExportIntegrity(exportedData) {
            try {
                const parsed = JSON.parse(exportedData);
                const validation = validateBackup(parsed);
                if (!validation.isValid) {
                    return {
                        valid: false,
                        errors: [validation.error || 'Unknown validation error']
                    };
                }
                const integrityErrors = this.validateDataIntegrity(parsed);
                return {
                    valid: integrityErrors.length === 0,
                    errors: integrityErrors
                };
            }
            catch (err) {
                return {
                    valid: false,
                    errors: [err.message]
                };
            }
        }
        validateDataIntegrity(backup) {
            const errors = [];
            if (!backup.accounts || !backup.stocks || !backup.bookings || !backup.bookingTypes) {
                errors.push('Missing required data arrays');
                return errors;
            }
            const undefinedAccountIds = backup.accounts.filter(a => a.cID === undefined).length;
            if (undefinedAccountIds > 0) {
                errors.push(`${undefinedAccountIds} accounts have undefined IDs`);
            }
            const undefinedStockIds = backup.stocks.filter(s => s.cID === undefined).length;
            if (undefinedStockIds > 0) {
                errors.push(`${undefinedStockIds} stocks have undefined IDs`);
            }
            const undefinedBookingIds = backup.bookings.filter(b => b.cID === undefined).length;
            if (undefinedBookingIds > 0) {
                errors.push(`${undefinedBookingIds} bookings have undefined IDs`);
            }
            const accountIds = new Set(backup.accounts.map(a => a.cID));
            const stockIds = new Set(backup.stocks.map(s => s.cID));
            const bookingTypeIds = new Set(backup.bookingTypes.map(bt => bt.cID));
            for (const booking of backup.bookings) {
                if (!accountIds.has(booking.cAccountNumberID)) {
                    errors.push(`Booking ${booking.cID} references non-existent account ${booking.cAccountNumberID}`);
                }
                if (booking.cStockID && !stockIds.has(booking.cStockID)) {
                    errors.push(`Booking ${booking.cID} references non-existent stock ${booking.cStockID}`);
                }
                if (!bookingTypeIds.has(booking.cBookingTypeID)) {
                    errors.push(`Booking ${booking.cID} references non-existent booking type ${booking.cBookingTypeID}`);
                }
                if (booking.cCredit < 0 || booking.cDebit < 0) {
                    errors.push(`Booking ${booking.cID} has negative credit/debit values`);
                }
                if (booking.cCredit > 0 && booking.cDebit > 0) {
                    errors.push(`Booking ${booking.cID} has both credit and debit values`);
                }
            }
            for (const stock of backup.stocks) {
                if (!accountIds.has(stock.cAccountNumberID)) {
                    errors.push(`Stock ${stock.cID} references non-existent account ${stock.cAccountNumberID}`);
                }
            }
            for (const bt of backup.bookingTypes) {
                if (!accountIds.has(bt.cAccountNumberID)) {
                    errors.push(`Booking type ${bt.cID} references non-existent account ${bt.cAccountNumberID}`);
                }
            }
            const duplicateAccounts = this.findDuplicates(backup.accounts.map(a => a.cID).filter((id) => id !== undefined));
            if (duplicateAccounts.length > 0) {
                errors.push(`Duplicate account IDs: ${duplicateAccounts.join(', ')}`);
            }
            const duplicateStocks = this.findDuplicates(backup.stocks.map(s => s.cID).filter((id) => id !== undefined));
            if (duplicateStocks.length > 0) {
                errors.push(`Duplicate stock IDs: ${duplicateStocks.join(', ')}`);
            }
            const duplicateBookings = this.findDuplicates(backup.bookings.map(b => b.cID).filter((id) => id !== undefined));
            if (duplicateBookings.length > 0) {
                errors.push(`Duplicate booking IDs: ${duplicateBookings.join(', ')}`);
            }
            return errors;
        }
        validateLegacyDataIntegrity(backup) {
            const errors = [];
            if (!backup.stocks || !backup.transfers) {
                errors.push('Missing required legacy data arrays');
                return errors;
            }
            const duplicateStocks = this.findDuplicates(backup.stocks.map(s => s.cID).filter((id) => id !== undefined));
            if (duplicateStocks.length > 0) {
                errors.push(`Duplicate stock IDs: ${duplicateStocks.join(', ')}`);
            }
            const stockIds = new Set(backup.stocks.map(s => s.cID));
            for (let i = 0; i < backup.transfers.length; i++) {
                const transfer = backup.transfers[i];
                if (transfer.cStockID && !stockIds.has(transfer.cStockID)) {
                    errors.push(`Transfer ${i + 1} references non-existent stock ${transfer.cStockID}`);
                }
            }
            return errors;
        }
        transformLegacyStock(rec, activeId) {
            return {
                cID: rec.cID,
                cAccountNumberID: activeId,
                cSymbol: rec.cSym,
                cMeetingDay: this._isoDate(rec.cMeetingDay),
                cQuarterDay: this._isoDate(rec.cQuarterDay),
                cCompany: rec.cCompany,
                cISIN: rec.cISIN,
                cFadeOut: rec.cFadeOut,
                cFirstPage: rec.cFirstPage,
                cURL: rec.cURL,
                cAskDates: this._DATE.ISO
            };
        }
        transformLegacyBooking(smTransfer, index, activeId) {
            const BOOKING_TYPES = this._INDEXED_DB.STORE.BOOKING_TYPES;
            const booking = {
                cID: index + 1,
                cAccountNumberID: activeId,
                cStockID: smTransfer.cStockID,
                cBookDate: this._isoDate(smTransfer.cDate),
                cBookingTypeID: smTransfer.cType,
                cExDate: this._isoDate(smTransfer.cExDay),
                cCount: Math.abs(smTransfer.cCount),
                cDescription: smTransfer.cDescription,
                cMarketPlace: smTransfer.cMarketPlace,
                cTransactionTaxCredit: smTransfer.cFTax > 0 ? smTransfer.cFTax : 0,
                cTransactionTaxDebit: smTransfer.cFTax < 0 ? -smTransfer.cFTax : 0,
                cSourceTaxCredit: smTransfer.cSTax > 0 ? smTransfer.cSTax : 0,
                cSourceTaxDebit: smTransfer.cSTax < 0 ? -smTransfer.cSTax : 0,
                cFeeCredit: smTransfer.cFees > 0 ? smTransfer.cFees : 0,
                cFeeDebit: smTransfer.cFees < 0 ? -smTransfer.cFees : 0,
                cTaxCredit: smTransfer.cTax > 0 ? smTransfer.cTax : 0,
                cTaxDebit: smTransfer.cTax < 0 ? -smTransfer.cTax : 0,
                cSoliCredit: smTransfer.cSoli > 0 ? smTransfer.cSoli : 0,
                cSoliDebit: smTransfer.cSoli < 0 ? -smTransfer.cSoli : 0,
                cCredit: smTransfer.cAmount > 0 ? smTransfer.cAmount : 0,
                cDebit: smTransfer.cAmount < 0 ? -smTransfer.cAmount : 0
            };
            const creditDebit = this.createCreditDebitObject(smTransfer);
            switch (smTransfer.cType) {
                case BOOKING_TYPES.BUY:
                    booking.cDebit = creditDebit.value;
                    booking.cCredit = 0;
                    break;
                case BOOKING_TYPES.SELL:
                case BOOKING_TYPES.DIVIDEND:
                    booking.cCredit = creditDebit.value;
                    booking.cDebit = 0;
                    break;
                case BOOKING_TYPES.CREDIT:
                    this.resetTaxesAndFees(booking);
                    booking.cBookingTypeID = creditDebit.type;
                    booking.cCredit = creditDebit.value;
                    booking.cDebit = 0;
                    break;
                case BOOKING_TYPES.DEBIT:
                    this.resetTaxesAndFees(booking);
                    booking.cBookingTypeID = creditDebit.type;
                    booking.cCredit = 0;
                    booking.cDebit = creditDebit.value;
                    break;
                default:
                    throw new Error(`Unknown booking type: ${smTransfer.cType}`);
            }
            return booking;
        }
        stringifyDatabase(sm, accounts, stocks, bookingTypes, bookings) {
            if (!accounts || !Array.isArray(accounts)) {
                throw new Error('Invalid accounts data');
            }
            if (!stocks || !Array.isArray(stocks)) {
                throw new Error('Invalid stocks data');
            }
            if (!bookingTypes || !Array.isArray(bookingTypes)) {
                throw new Error('Invalid booking types data');
            }
            if (!bookings || !Array.isArray(bookings)) {
                throw new Error('Invalid bookings data');
            }
            const exportData = {
                sm,
                accounts,
                stocks,
                bookingTypes,
                bookings
            };
            try {
                return JSON.stringify(exportData, null, 2);
            }
            catch (err) {
                throw new Error(`Failed to serialize data: ${err.message}`);
            }
        }
        findDuplicates(arr) {
            const seen = new Set();
            const duplicates = new Set();
            for (const id of arr) {
                if (seen.has(id)) {
                    duplicates.add(id);
                }
                seen.add(id);
            }
            return Array.from(duplicates);
        }
        createCreditDebitObject(rec) {
            const BOOKING_TYPES = this._INDEXED_DB.STORE.BOOKING_TYPES;
            const result = { value: 0, type: -1 };
            if (rec.cAmount !== 0) {
                result.type = BOOKING_TYPES.OTHER;
            }
            else if (rec.cFees !== 0) {
                result.type = BOOKING_TYPES.FEE;
            }
            else if (rec.cTax !== 0 || rec.cSoli !== 0 || rec.cSTax !== 0 || rec.cFTax !== 0) {
                result.type = BOOKING_TYPES.TAX;
            }
            if (rec.cType === BOOKING_TYPES.BUY) {
                return { value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.BUY };
            }
            if (rec.cType === BOOKING_TYPES.SELL) {
                return { value: rec.cUnitQuotation * -rec.cCount, type: BOOKING_TYPES.SELL };
            }
            if (rec.cType === BOOKING_TYPES.DIVIDEND) {
                return { value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.DIVIDEND };
            }
            if (rec.cType === BOOKING_TYPES.CREDIT) {
                result.value = rec.cAmount + rec.cFees + rec.cSTax + rec.cFTax + rec.cTax + rec.cSoli;
                return result;
            }
            if (rec.cType === BOOKING_TYPES.DEBIT) {
                result.value = -rec.cAmount - rec.cFees - rec.cSTax - rec.cFTax - rec.cTax - rec.cSoli;
                return result;
            }
            throw new Error(`Unknown booking type: ${rec.cType}`);
        }
        resetTaxesAndFees(booking) {
            booking.cFeeCredit = 0;
            booking.cFeeDebit = 0;
            booking.cTransactionTaxCredit = 0;
            booking.cTransactionTaxDebit = 0;
            booking.cSourceTaxCredit = 0;
            booking.cSourceTaxDebit = 0;
            booking.cTaxCredit = 0;
            booking.cTaxDebit = 0;
            booking.cSoliCredit = 0;
            booking.cSoliDebit = 0;
        }
    }
    function validateBackup(data) {
        if (!data || typeof data !== 'object') {
            return { isValid: false, version: -1, error: 'Invalid data format' };
        }
        const backup = data;
        if (!backup.sm?.cDBVersion) {
            return { isValid: false, version: -1, error: 'Missing version information' };
        }
        if (backup.sm.cDBVersion < INDEXED_DB.SM_IMPORT_VERSION) {
            return { isValid: false, version: backup.sm.cDBVersion, error: 'Version too old' };
        }
        const isLegacy = backup.sm.cDBVersion === INDEXED_DB.SM_IMPORT_VERSION;
        if (isLegacy) {
            if (!backup.stocks || !Array.isArray(backup.stocks)) {
                return { isValid: false, version: backup.sm.cDBVersion, error: 'Missing or invalid stocks data' };
            }
            if (!backup.transfers || !Array.isArray(backup.transfers)) {
                return { isValid: false, version: backup.sm.cDBVersion, error: 'Missing or invalid transfers data' };
            }
        }
        else {
            const requiredFields = [
                { field: backup.accounts, name: 'accounts' },
                { field: backup.stocks, name: 'stocks' },
                { field: backup.bookingTypes, name: 'bookingTypes' },
                { field: backup.bookings, name: 'bookings' }
            ];
            for (const { field, name } of requiredFields) {
                if (!field || !Array.isArray(field)) {
                    return { isValid: false, version: backup.sm.cDBVersion, error: `Missing or invalid ${name} data` };
                }
            }
        }
        return { isValid: true, version: backup.sm.cDBVersion };
    }
    async function readJsonFile(blob) {
        if (!blob || blob.size === 0) {
            throw new Error('Empty or invalid file');
        }
        let text;
        try {
            text = await blob.text();
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                throw new Error(`Invalid JSON format: ${err.message}`);
            }
            throw err;
        }
        if (!text || text.trim().length === 0) {
            throw new Error('File contains no data');
        }
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                throw new Error(`Invalid JSON format: ${err.message}`);
            }
            throw err;
        }
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid JSON structure');
        }
        return parsed;
    }
    return {
        ImportExportService,
        readJsonFile,
        validateBackup
    };
}
