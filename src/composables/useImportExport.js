import { INDEXED_DB } from '@/configurations/indexed_db';
export class ImportExportError extends Error {
    _code;
    _context;
    constructor(message, _code, _context) {
        super(message);
        this._code = _code;
        this._context = _context;
        this.name = 'ImportExportError';
    }
}
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
        stringifyDatabase(sm, accounts, stocks, bookingTypes, bookings) {
            this.validateExportData(accounts, stocks, bookingTypes, bookings);
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
                throw new ImportExportError('Failed to serialize data', 'SERIALIZE_FAILED', { originalError: err });
            }
        }
        validateExportData(accounts, stocks, bookingTypes, bookings) {
            const errors = [];
            if (!Array.isArray(accounts))
                errors.push('Invalid accounts data');
            if (!Array.isArray(stocks))
                errors.push('Invalid stocks data');
            if (!Array.isArray(bookingTypes))
                errors.push('Invalid booking types data');
            if (!Array.isArray(bookings))
                errors.push('Invalid bookings data');
            if (errors.length > 0) {
                throw new ImportExportError('Export data validation failed', 'VALIDATION_FAILED', { errors });
            }
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
                    errors: [`Parse error: ${err.message}`]
                };
            }
        }
        validateDataIntegrity(backup) {
            const errors = [];
            if (!backup.accounts || !backup.stocks || !backup.bookings || !backup.bookingTypes) {
                return ['Missing required data arrays'];
            }
            errors.push(...this.checkUndefinedIds(backup));
            errors.push(...this.validateForeignKeys(backup));
            errors.push(...this.checkDuplicateIds(backup));
            errors.push(...this.validateBusinessRules(backup));
            return errors;
        }
        checkUndefinedIds(backup) {
            const errors = [];
            const undefinedAccounts = backup.accounts.filter(a => a.cID === undefined).length;
            if (undefinedAccounts > 0) {
                errors.push(`${undefinedAccounts} accounts have undefined IDs`);
            }
            const undefinedStocks = backup.stocks.filter(s => s.cID === undefined).length;
            if (undefinedStocks > 0) {
                errors.push(`${undefinedStocks} stocks have undefined IDs`);
            }
            const undefinedBookings = backup.bookings.filter(b => b.cID === undefined).length;
            if (undefinedBookings > 0) {
                errors.push(`${undefinedBookings} bookings have undefined IDs`);
            }
            return errors;
        }
        validateForeignKeys(backup) {
            const errors = [];
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
            return errors;
        }
        checkDuplicateIds(backup) {
            const errors = [];
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
        validateBusinessRules(backup) {
            const errors = [];
            for (const booking of backup.bookings) {
                if (booking.cCredit < 0 || booking.cDebit < 0) {
                    errors.push(`Booking ${booking.cID} has negative credit/debit values`);
                }
                if (booking.cCredit > 0 && booking.cDebit > 0) {
                    errors.push(`Booking ${booking.cID} has both credit and debit values`);
                }
                if (booking.cCredit === 0 && booking.cDebit === 0) {
                    errors.push(`Booking ${booking.cID} has zero for both credit and debit`);
                }
            }
            return errors;
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
        validateLegacyDataIntegrity(backup) {
            const errors = [];
            if (!backup.stocks || !backup.transfers) {
                return ['Missing required legacy data arrays'];
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
            switch (rec.cType) {
                case BOOKING_TYPES.BUY:
                    return { value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.BUY };
                case BOOKING_TYPES.SELL:
                    return { value: rec.cUnitQuotation * -rec.cCount, type: BOOKING_TYPES.SELL };
                case BOOKING_TYPES.DIVIDEND:
                    return { value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.DIVIDEND };
                case BOOKING_TYPES.CREDIT:
                    result.value = rec.cAmount + rec.cFees + rec.cSTax + rec.cFTax + rec.cTax + rec.cSoli;
                    return result;
                case BOOKING_TYPES.DEBIT:
                    result.value = -rec.cAmount - rec.cFees - rec.cSTax - rec.cFTax - rec.cTax - rec.cSoli;
                    return result;
                default:
                    throw new ImportExportError('Unknown booking type', 'UNKNOWN_BOOKING_TYPE', { type: rec.cType });
            }
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
            return {
                isValid: false,
                version: -1,
                error: 'Missing version information'
            };
        }
        if (backup.sm.cDBVersion < INDEXED_DB.SM_IMPORT_VERSION) {
            return {
                isValid: false,
                version: backup.sm.cDBVersion,
                error: `Version ${backup.sm.cDBVersion} is too old (minimum: ${INDEXED_DB.SM_IMPORT_VERSION})`
            };
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
                    return {
                        isValid: false,
                        version: backup.sm.cDBVersion,
                        error: `Missing or invalid ${name} data`
                    };
                }
            }
        }
        return { isValid: true, version: backup.sm.cDBVersion };
    }
    async function readJsonFile(blob) {
        if (!blob || blob.size === 0) {
            throw new ImportExportError('Empty or invalid file', 'EMPT_FILE');
        }
        const MAX_SIZE = 100 * 1024 * 1024;
        if (blob.size > MAX_SIZE) {
            throw new ImportExportError('File too large', 'FILE_TOO_LARGE', { size: blob.size, maxSize: MAX_SIZE });
        }
        let text;
        try {
            text = await blob.text();
        }
        catch (err) {
            throw new ImportExportError('Failed to read file', 'READ_FAILED', { originalError: err });
        }
        if (!text || text.trim().length === 0) {
            throw new ImportExportError('File contains no data', 'NO_DATA');
        }
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                throw new ImportExportError(`Invalid JSON format: ${err.message}`, 'INVALID_JSON', { originalError: err });
            }
            throw err;
        }
        if (!parsed || typeof parsed !== 'object') {
            throw new ImportExportError('Invalid JSON structure', 'INVALID_STRUCTURE');
        }
        return parsed;
    }
    return {
        ImportExportService,
        readJsonFile,
        validateBackup
    };
}
