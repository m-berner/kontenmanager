export function useImportExport() {
    class ImportExportService {
        _CONS;
        _isoDate;
        constructor(_CONS, _isoDate) {
            this._CONS = _CONS;
            this._isoDate = _isoDate;
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
                cAskDates: this._CONS.DATE.DEFAULT_ISO
            };
        }
        transformLegacyBooking(smTransfer, index, activeId) {
            const BOOKING_TYPES = this._CONS.INDEXED_DB.STORES.BOOKING_TYPES;
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
            if (smTransfer.cType === BOOKING_TYPES.BUY) {
                booking.cDebit = creditDebit.value;
                booking.cCredit = 0;
            }
            else if (smTransfer.cType === BOOKING_TYPES.SELL || smTransfer.cType === BOOKING_TYPES.DIVIDEND) {
                booking.cCredit = creditDebit.value;
                booking.cDebit = 0;
            }
            else if (smTransfer.cType === 4) {
                this.resetTaxesAndFees(booking);
                booking.cBookingTypeID = creditDebit.type;
                booking.cCredit = creditDebit.value;
                booking.cDebit = 0;
            }
            else if (smTransfer.cType === 5) {
                this.resetTaxesAndFees(booking);
                booking.cBookingTypeID = creditDebit.type;
                booking.cCredit = 0;
                booking.cDebit = creditDebit.value;
            }
            return booking;
        }
        stringifyDatabase(accounts, stocks, bookingTypes, bookings) {
            const stringifyArray = (arrayName, array, isLast = false) => {
                let buffer = `"${arrayName}":[\n`;
                for (let i = 0; i < array.length; i++) {
                    buffer += JSON.stringify(array[i]);
                    buffer += i === array.length - 1 ? '\n]' : ',\n';
                }
                if (array.length === 0) {
                    buffer += ']';
                }
                return buffer + (isLast ? '\n' : ',\n');
            };
            return (stringifyArray('accounts', accounts) +
                stringifyArray('stocks', stocks) +
                stringifyArray('bookingTypes', bookingTypes) +
                stringifyArray('bookings', bookings, true));
        }
        createCreditDebitObject(rec) {
            const BOOKING_TYPES = this._CONS.INDEXED_DB.STORES.BOOKING_TYPES;
            let result = { value: 0, type: -1 };
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
                    result = { value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.BUY };
                    break;
                case BOOKING_TYPES.SELL:
                    result = { value: rec.cUnitQuotation * -rec.cCount, type: BOOKING_TYPES.SELL };
                    break;
                case BOOKING_TYPES.DIVIDEND:
                    result = { value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.DIVIDEND };
                    break;
                case BOOKING_TYPES.CREDIT:
                    result.value = rec.cAmount + rec.cFees + rec.cSTax + rec.cFTax + rec.cTax + rec.cSoli;
                    break;
                case BOOKING_TYPES.DEBIT:
                    result.value = -rec.cAmount - rec.cFees - rec.cSTax - rec.cFTax - rec.cTax - rec.cSoli;
                    break;
                default:
                    throw new Error('ImportExportService: unknown booking type');
            }
            return result;
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
    return {
        ImportExportService
    };
}
