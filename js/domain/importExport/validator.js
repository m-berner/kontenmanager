import { INDEXED_DB } from '@/services/database/config';
export class ImportExportValidator {
    static validateBackup(data) {
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
    static validateDataIntegrity(backup) {
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
    static validateLegacyDataIntegrity(backup) {
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
    static checkUndefinedIds(backup) {
        const errors = [];
        const undefinedAccounts = backup.accounts.filter(a => a.cID === undefined).length;
        if (undefinedAccounts > 0)
            errors.push(`${undefinedAccounts} accounts have undefined IDs`);
        const undefinedStocks = backup.stocks.filter(s => s.cID === undefined).length;
        if (undefinedStocks > 0)
            errors.push(`${undefinedStocks} stocks have undefined IDs`);
        const undefinedBookings = backup.bookings.filter(b => b.cID === undefined).length;
        if (undefinedBookings > 0)
            errors.push(`${undefinedBookings} bookings have undefined IDs`);
        return errors;
    }
    static validateForeignKeys(backup) {
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
    static checkDuplicateIds(backup) {
        const errors = [];
        const duplicateAccounts = this.findDuplicates(backup.accounts.map(a => a.cID).filter((id) => id !== undefined));
        if (duplicateAccounts.length > 0)
            errors.push(`Duplicate account IDs: ${duplicateAccounts.join(', ')}`);
        const duplicateStocks = this.findDuplicates(backup.stocks.map(s => s.cID).filter((id) => id !== undefined));
        if (duplicateStocks.length > 0)
            errors.push(`Duplicate stock IDs: ${duplicateStocks.join(', ')}`);
        const duplicateBookings = this.findDuplicates(backup.bookings.map(b => b.cID).filter((id) => id !== undefined));
        if (duplicateBookings.length > 0)
            errors.push(`Duplicate booking IDs: ${duplicateBookings.join(', ')}`);
        return errors;
    }
    static validateBusinessRules(backup) {
        const errors = [];
        for (const booking of backup.bookings) {
            if (booking.cCredit < 0 && booking.cDebit < 0)
                errors.push(`Booking ${booking.cID} has negative credit/debit values`);
            if (booking.cCredit > 0 && booking.cDebit > 0)
                errors.push(`Booking ${booking.cID} has positive credit/debit values`);
        }
        return errors;
    }
    static findDuplicates(arr) {
        const seen = new Set();
        const duplicates = new Set();
        for (const id of arr) {
            if (seen.has(id))
                duplicates.add(id);
            seen.add(id);
        }
        return Array.from(duplicates);
    }
}
