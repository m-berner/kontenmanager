/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {BOOKING_TYPE_ROLE, CURRENCIES, DATE, INDEXED_DB, PORTFOLIO} from "@/domain/constants";
import type {
    AccountDb,
    AccountStoreContract,
    BookingDb,
    BookingStoreContract,
    BookingTypeDb,
    BookingTypeStoreContract,
    NumberStringPair,
    RecordsDbData,
    SettingsStoreContract,
    StockItem,
    StockRecord,
    StockStoreContract
} from "@/domain/types";
import {compareIsoDateDesc, isValidISODate, log, round2, utcDate} from "@/domain/utils/utils";

/**
 * Resolves the `cID` of the current account's booking type for a given role
 * (buy/sell/dividend). Booking-type ids are a single, globally auto-incrementing
 * counter shared across every account (see `bookingTypes` IndexedDB store) — only
 * the role, not the id, is stable/meaningful per account.
 *
 * @param bookingTypes - The account's own booking types.
 * @param role - The role to resolve.
 * @returns The matching booking type's id, or `undefined` if the account has none.
 */
function resolveTypeIdByRole(
    bookingTypes: Pick<BookingTypeDb, "cID" | "cRole">[],
    role: BookingTypeDb["cRole"]
): number | undefined {
    return bookingTypes.find((t) => t.cRole === role)?.cID;
}

/**
 * The currency every monetary figure on screen is denominated in.
 *
 * One definition, because three different layers need the same answer and must
 * not drift: `useOnlineStockData` converts quotes into it, `currencySync`
 * formats with it, and `appAdapter` fetches the FX pairs for it. Deriving it
 * three times is how they would end up disagreeing — which is precisely the
 * class of bug this replaced, where the quote was converted to one currency and
 * the label printed another.
 *
 * The **active account's** `cCurrency` wins, because that is what the figures
 * actually are: booking amounts are stored as entered under that account, and a
 * quote is converted into it. `settings.currency` is only the fallback for when
 * no account is selected (a fresh install, or after deleting the last account),
 * where there are no account-scoped figures to label anyway.
 *
 * Note this is deliberately NOT derived from the UI locale. Language and
 * currency are independent properties of a user — someone can run an
 * English-language browser and hold euros — and binding them put every eurozone
 * user whose browser was not German onto USD. The locale still decides
 * *formatting* (separators, grouping, symbol placement), which is the part a
 * locale should own: `Intl.NumberFormat("en-US", {currency: "EUR"})` renders
 * `€1,234.56` and `de-DE` renders `1.234,56 €` — same amount, same currency.
 *
 * @param accounts - The accounts currently in the store.
 * @param activeAccountId - The selected account id, or the "none" sentinel.
 * @param fallbackCurrency - `settings.currency`, the app-level default.
 * @returns The ISO code to convert into and format with.
 */
export function resolveDisplayCurrency(
    accounts: Pick<AccountDb, "cID" | "cCurrency">[],
    activeAccountId: number,
    fallbackCurrency: string
): string {
    const active = accounts.find((entry) => entry.cID === activeAccountId);
    return active?.cCurrency || fallbackCurrency || CURRENCIES.EUR;
}

/**
 * Zeroes the stock/tax/soli/source-tax/fee/transaction-tax fields that don't
 * apply to a booking's resolved role, mirroring `formMapper.ts`'s
 * `mapBookingFormToDb` gating (which only runs for form-entered bookings).
 * Used on the backup-import and rollback-restore paths, where a booking's raw
 * field values come from a JSON file rather than a role-aware form, so a
 * stray value left over from before the booking type's role changed (or from
 * a backup exported before roles existed) would otherwise be silently
 * imported and counted in calculateSumAllFees/Taxes/calculateTotalSum.
 *
 * @param booking - The booking record to sanitize.
 * @param bookingTypes - The account's own booking types, to resolve the booking's role.
 * @returns A copy of the booking with any role-inapplicable field zeroed.
 */
export function applyBookingRoleInvariants(
    booking: BookingDb,
    bookingTypes: Pick<BookingTypeDb, "cID" | "cRole">[]
): BookingDb {
    const role = bookingTypes.find((t) => t.cID === booking.cBookingTypeID)?.cRole;
    const isStockRelated =
        role === BOOKING_TYPE_ROLE.BUY ||
        role === BOOKING_TYPE_ROLE.SELL ||
        role === BOOKING_TYPE_ROLE.DIVIDEND;
    const isDividendOrSell = role === BOOKING_TYPE_ROLE.SELL || role === BOOKING_TYPE_ROLE.DIVIDEND;
    const isBuyOrSell = role === BOOKING_TYPE_ROLE.BUY || role === BOOKING_TYPE_ROLE.SELL;
    const isBuy = role === BOOKING_TYPE_ROLE.BUY;

    return {
        ...booking,
        cStockID: isStockRelated ? booking.cStockID : 0,
        cCount: isStockRelated ? booking.cCount : 0,
        cMarketPlace: isBuyOrSell ? booking.cMarketPlace : "",
        cSoli: isDividendOrSell ? booking.cSoli : 0,
        cTax: isDividendOrSell ? booking.cTax : 0,
        cSourceTax: isDividendOrSell ? booking.cSourceTax : 0,
        cFee: isBuyOrSell ? booking.cFee : 0,
        cTransactionTax: isBuy ? booking.cTransactionTax : 0
    };
}

/**
 * Aggregates booking sums per type for a specific year.
 *
 * @param bookings - Array of bookings to aggregate.
 * @param bookingTypes - List of available booking types.
 * @param year - Optional target year for filtering.
 * @returns Array of objects containing sum (key) and type name (value).
 */
export function aggregateBookingsPerType(
    bookings: BookingDb[],
    bookingTypes: {
        cID: number;
        cName: string;
    }[],
    year?: number
): NumberStringPair[] {
    return bookingTypes.map((type) => {
        const sum = bookings
            .filter((entry) => {
                const matchType = entry.cBookingTypeID === type.cID;
                // Explicit `undefined` check rather than a truthiness test:
                // a falsy-but-supplied year (0) would otherwise silently mean
                // "all years". Year 0 is not reachable from a real ISO date,
                // but this is the same truthy-vs-nullish shape that rounds 9-11
                // found three times on `clearable` selects emitting `null`.
                const matchYear = year !== undefined
                    ? matchesBookingYear(entry, year)
                    : true;
                return matchType && matchYear;
            })
            .reduce((acc, entry) => acc + (entry.cCredit - entry.cDebit), 0);
        return {key: round2(sum), value: type.cName};
    });
}

/**
 * Calculates the total investment value still held in a stock (FIFO principle).
 *
 * @param bookings - Array of bookings.
 * @param stockId - ID of the stock.
 * @param bookingTypes - The account's own booking types (to resolve which id is "Buy").
 * @returns Total investment value.
 */
export function calculateInvestByStockId(
    bookings: BookingDb[],
    stockId: number,
    bookingTypes: Pick<BookingTypeDb, "cID" | "cRole">[]
): number {
    const rawPortfolio = calculatePortfolioByStockId(bookings, stockId, bookingTypes);
    // Match calculateTotalDepotValue: a quantity below the minimum threshold
    // is floating-point BUY/SELL residue, i.e. the position is sold out.
    const totalPortfolio = rawPortfolio >= PORTFOLIO.MINIMUM_THRESHOLD ? rawPortfolio : 0;
    let runningCount = 0;

    const buyTypeId = resolveTypeIdByRole(bookingTypes, BOOKING_TYPE_ROLE.BUY);
    const total = bookings
        .filter(
            (entry) =>
                entry.cStockID === stockId &&
                entry.cBookingTypeID === buyTypeId
        )
        // compareIsoDateDesc, not `utcMs(b) - utcMs(a)`: a single booking with a
        // blank cBookDate made that subtraction return NaN, which left the sort
        // order arbitrary for EVERY lot — silently attributing the cost basis to
        // the wrong ones. See the comparator's own doc comment.
        .sort((a, b) => compareIsoDateDesc(a.cBookDate, b.cBookDate))
        .reduce((acc, entry) => {
            const prev = runningCount;
            runningCount += entry.cCount;
            if (prev >= totalPortfolio || entry.cCount === 0) return acc;
            const used = Math.min(entry.cCount, totalPortfolio - prev);
            return acc + (used / entry.cCount) * entry.cDebit;
        }, 0);

    return round2(total);
}

/**
 * Calculates the current portfolio quantity for a stock.
 *
 * @param bookings - Array of bookings.
 * @param stockId - ID of the stock.
 * @param bookingTypes - The account's own booking types (to resolve which ids are "Buy"/"Sell").
 * @returns Portfolio quantity.
 */
export function calculatePortfolioByStockId(
    bookings: BookingDb[],
    stockId: number,
    bookingTypes: Pick<BookingTypeDb, "cID" | "cRole">[]
): number {
    const buyTypeId = resolveTypeIdByRole(bookingTypes, BOOKING_TYPE_ROLE.BUY);
    const sellTypeId = resolveTypeIdByRole(bookingTypes, BOOKING_TYPE_ROLE.SELL);
    return bookings.reduce((acc, entry) => {
        if (entry.cStockID === stockId) {
            if (entry.cBookingTypeID === buyTypeId)
                return acc + entry.cCount;
            if (entry.cBookingTypeID === sellTypeId)
                return acc - entry.cCount;
        }
        return acc;
    }, 0);
}

/**
 * Retrieves all dividend bookings for a specific stock.
 *
 * @param bookings - Array of bookings.
 * @param stockId - ID of the stock.
 * @param bookingTypes - The account's own booking types (to resolve which id is "Dividend").
 * @returns A list of dividend entries containing id, exDate, and sum (credit).
 */
export function getDividendBookingsByStockId(
    bookings: BookingDb[],
    stockId: number,
    bookingTypes: Pick<BookingTypeDb, "cID" | "cRole">[]
): { id: number; exDate: string; sum: number }[] {
    const dividendTypeId = resolveTypeIdByRole(bookingTypes, BOOKING_TYPE_ROLE.DIVIDEND);
    return bookings
        .filter(
            (entry) =>
                entry.cStockID === stockId &&
                entry.cBookingTypeID === dividendTypeId
        )
        // Named `exDate`, not `year`: it carries the booking's full cExDate and
        // the column that renders it is labeled "Ex-date"/"Ex-Tag", so the old
        // name described neither the value nor its presentation.
        .map((entry) => ({id: entry.cID, exDate: entry.cExDate, sum: entry.cCredit}));
}

/**
 * Total sum of all fees across all years.
 *
 * @param bookings - Array of bookings.
 * @returns Total fees.
 */
export function calculateSumAllFees(bookings: BookingDb[]): number {
    return sumAll(bookings, (entry) => -calculateEntryFees(entry));
}

/**
 * Total sum of all taxes across all years.
 *
 * @param bookings - Array of bookings.
 * @returns Total taxes.
 */
export function calculateSumAllTaxes(bookings: BookingDb[]): number {
    return sumAll(bookings, (entry) => -calculateEntryTaxes(entry));
}

/**
 * Calculates the sum of fees for a specific year.
 *
 * @param bookings - Array of bookings to filter and sum.
 * @param year - The target year.
 * @returns Total fees for the year.
 */
export function calculateSumFees(bookings: BookingDb[], year: number): number {
    return sumByYear(bookings, year, (entry) => -calculateEntryFees(entry));
}

/**
 * Calculates the sum of taxes for a specific year.
 *
 * @param bookings - Array of bookings to filter and sum.
 * @param year - The target year.
 * @returns Total taxes for the year.
 */
export function calculateSumTaxes(bookings: BookingDb[], year: number): number {
    return sumByYear(bookings, year, (entry) => -calculateEntryTaxes(entry));
}

/**
 * Calculates the total depot value for a list of stocks.
 *
 * @param stocks - Array of stocks.
 * @returns Total depot value.
 */
export function calculateTotalDepotValue(stocks: StockItem[]): number {
    const sum = stocks.reduce((acc, rec) => {
        if (rec.mPortfolio !== undefined && rec.mPortfolio >= PORTFOLIO.MINIMUM_THRESHOLD) {
            return acc + rec.mPortfolio * (rec.mValue ?? 0);
        }
        return acc;
    }, 0);
    return round2(sum);
}

/**
 * Calculates the total sum of bookings considering all taxes and fees.
 *
 * @param bookings - Array of bookings to sum.
 * @returns The total balance rounded to 2 decimal places.
 */
export function calculateTotalSum(bookings: BookingDb[]): number {
    if (bookings.length === 0) return 0;
    const sum = bookings.reduce((acc, entry) => {
        const fees = calculateEntryFees(entry);
        const taxes = calculateEntryTaxes(entry);
        return acc + (entry.cCredit - entry.cDebit) - (fees + taxes);
    }, 0);
    return round2(sum);
}

/**
 * Resolves the accounting summary's total, and whether its Taxes/Fees rows
 * should be shown at all.
 *
 * Gated on the figures themselves (non-zero), not on whether the account is
 * currently marked as a depot account. `cWithDepot` can be switched off on an
 * account that still carries Buy/Sell/Dividend booking types and fee/tax
 * -bearing bookings — turning it off deletes nothing, and a booking's fee/tax
 * fieldsets gate on the type's *role*, not on `cWithDepot` — so a
 * formerly-depot account can still accrue real, non-zero fees and taxes after
 * the toggle. Gating the rows on `isDepot` instead let a toggle change what
 * ShowAccounting's Sum showed without changing {@link calculateTotalSum}'s
 * balance (which subtracts fees+taxes unconditionally, for every account):
 * two totals for the same account, differing by every fee and tax ever
 * booked, with nothing on screen to explain the gap.
 *
 * @param finalSum - The sum of **every** booking-type row, Buy and Sell
 *   included. `ShowAccounting` splits those two out of its paginated body and
 *   pins them below it, but they are still displayed rows and still part of
 *   the total — reading this as "the non-Buy/Sell rows" (which the wording
 *   here used to invite) and matching the call site to it would drop every
 *   purchase and sale from the sum, and break the identity below.
 *
 *   That identity is what makes the figure checkable: `aggregateBookingsPerType`
 *   yields `cCredit - cDebit` per type, so summing all types gives
 *   `Σ(cCredit - cDebit)`, and `taxes`/`fees` arrive already negated
 *   ({@link calculateSumTaxes}, {@link calculateSumFees}). `finalSum + taxes + fees`
 *   therefore reproduces {@link calculateTotalSum} exactly.
 * @param taxes - Total taxes for the selected period.
 * @param fees - Total fees for the selected period.
 * @returns Whether to show the Taxes/Fees rows, and the resulting total —
 *   `finalSum` alone when both are zero, otherwise `finalSum + taxes + fees`,
 *   so the total never disagrees with the sum of the rows actually shown.
 */
export function resolveAccountingTotal(
    finalSum: number,
    taxes: number,
    fees: number
): { showTaxesAndFees: boolean; total: number } {
    const showTaxesAndFees = taxes !== 0 || fees !== 0;
    return {
        showTaxesAndFees,
        total: showTaxesAndFees ? finalSum + taxes + fees : finalSum
    };
}

/**
 * Checks if a stock has any associated bookings.
 *
 * @param stockId - The ID of the stock to check.
 * @param bookings - The list of bookings to search through.
 * @returns True if at least one booking is associated with the stock.
 */
export function hasBookings(stockId: number, bookings: { cStockID: number }[]): boolean {
    return bookings.some((booking) => booking.cStockID === stockId);
}

/**
 * Builds the sentinel "no stock" row every account's stocks store must carry
 * (cID 0, faded out) so that stock-select dropdowns (e.g. BookingForm.vue's
 * stock picker) have a blank entry. Every path that populates the stocks
 * store from scratch must add this, not just the ones that go through
 * initializeRecords.
 *
 * @param activeAccountId - The account this placeholder belongs to.
 * @returns The placeholder stock row.
 */
export function createPlaceholderStock(activeAccountId: number): StockRecord {
    return {
        cID: 0,
        cISIN: "XX0000000000",
        cSymbol: "XXXOO0",
        cFadeOut: 1,
        cFirstPage: 0,
        cURL: "",
        cCompany: "",
        cMeetingDay: "",
        cQuarterDay: "",
        cAccountNumberID: activeAccountId,
        cAskDates: DATE.ISO
    };
}

/**
 * Orchestrates the initialization of all records stores with data from the database.
 *
 * @param storesDB - The raw data fetched from IndexedDB.
 * @param stores - The Pinia store instances to initialize.
 * @param messages - Localization messages for alerts.
 * @param removeAccounts - Whether the accounts store participates in this
 *        initialization. When `true` (the default) it is cleared and
 *        repopulated from `storesDB.accountsDB`; when `false` it is left
 *        untouched. The flag gates the **repopulate as well as the clear**:
 *        `accounts.add()` is a blind append with no upsert, so gating only the
 *        clear appended a second copy of every account — which then made
 *        `isDuplicateAccountIban` report every existing IBAN as taken and
 *        blocked account edits. The other three stores are always reloaded.
 */
export async function initializeRecords(
    storesDB: RecordsDbData,
    stores: {
        accounts: AccountStoreContract;
        bookings: BookingStoreContract;
        bookingTypes: BookingTypeStoreContract;
        stocks: StockStoreContract;
        settings: SettingsStoreContract;
    },
    messages: Record<string, string>,
    removeAccounts = true
): Promise<void> {
    // Clean stores
    if (removeAccounts) stores.accounts.clean();
    stores.bookings.clean();
    stores.bookingTypes.clean();
    stores.stocks.clean();

    // Bulk add to stores (normalize optional identifiers for uniform UI).
    // Gated on the same flag as the clean above — see the parameter doc.
    if (removeAccounts) {
        storesDB.accountsDB.forEach((a) =>
            stores.accounts.add({
                ...a,
                cIban: a.cIban ?? ""
            })
        );
    }
    storesDB.bookingTypesDB.forEach((bt) => stores.bookingTypes.add(bt));
    storesDB.stocksDB.forEach((s) =>
        stores.stocks.add(
            {
                ...s,
                cISIN: s.cISIN ?? "",
                cSymbol: s.cSymbol ?? "",
                ...INDEXED_DB.STORE.STOCK_MEMORY
            }
        )
    );
    storesDB.bookingsDB.forEach((b) => stores.bookings.add(b));

    // Sort bookings
    // Same NaN-comparator hazard as calculateInvestByStockId's FIFO sort: one
    // dateless booking used to scramble the whole table's order, not just its own
    // position.
    stores.bookings.items.sort(
        (a: BookingDb, b: BookingDb) =>
            compareIsoDateDesc(a.cBookDate, b.cBookDate)
    );

    // Add default stock entry
    stores.stocks.add(createPlaceholderStock(stores.settings.activeAccountId), true);

    // Check for empty accounts and log if necessary
    if (stores.accounts.items.length === 0) {
        log(
            "DOMAINS DomainLogic: initializeRecords",
            messages,
            "info"
        );
    }
}

/**
 * The net entry fee. `cFee` is already signed (positive = debit/cost,
 * negative = credit/refund) — see its doc comment on `BookingDb`.
 *
 * @param entry - The booking database entry.
 * @returns The calculated net entry fees.
 */
function calculateEntryFees(entry: BookingDb): number {
    return entry.cFee;
}

/**
 * The total entry taxes: tax + source tax + transaction tax + soli, each
 * already signed (positive = debit/cost, negative = credit/refund).
 *
 * @param entry - The booking database record.
 * @returns The total calculated tax value based on the provided entry data.
 */
function calculateEntryTaxes(entry: BookingDb): number {
    return entry.cTax + entry.cSourceTax + entry.cTransactionTax + entry.cSoli;
}

/**
 * Extracts the year from the booking date of a given booking entry.
 *
 * Guarded with `isValidISODate` rather than calling `utcDate` directly:
 * `utcDate` returns an Invalid Date for `""` but **throws** an AppError for a
 * non-empty, non-ISO string (`utils.ts`), and nothing re-validates on the read
 * path — `databaseAdapter.getAccountRecords` hands back raw `IDBIndex.getAll()`
 * rows, so a pre-existing row holding e.g. `"15.03.2024"` reaches here intact.
 * Unguarded, that threw out of `sumByYear`/`aggregateBookingsPerType` and took
 * down the whole accounting view. Degrading to `NaN` matches the blank-date
 * branch `utcDate` already documents, so both malformed shapes now behave
 * alike. Same treatment `useOnlineStockData.toTimestamp` gives the three stock
 * date columns; the booking date was the one that was missed.
 *
 * @param entry - An object containing the `cBookDate` property,
 *                which represents the booking date in string format.
 * @returns The year of `cBookDate`, or `NaN` if it is blank or malformed.
 */
function getBookingYear(entry: Pick<BookingDb, "cBookDate">): number {
    if (!isValidISODate(entry.cBookDate)) {
        return Number.NaN;
    }
    return utcDate(entry.cBookDate).getUTCFullYear();
}

/**
 * Whether a booking belongs to the requested year.
 *
 * Exists because `getBookingYear(entry) === year` cannot express "undated":
 * an undated booking's year is `NaN`, and `NaN === NaN` is false, so a direct
 * comparison excludes those rows from every year while `sumAll`/`calculateTotalSum`
 * keep counting them — the all-time figure then differs from the sum of the
 * per-year figures with nothing on screen to explain the gap.
 *
 * `DATE.UNDATED_YEAR` selects exactly that population.
 *
 * @param entry - The booking to test.
 * @param year - A calendar year, or `DATE.UNDATED_YEAR` for bookings with no
 *               usable `cBookDate`.
 * @returns Whether the booking falls in the requested year.
 */
function matchesBookingYear(entry: Pick<BookingDb, "cBookDate">, year: number): boolean {
    const bookingYear = getBookingYear(entry);

    return year === DATE.UNDATED_YEAR
        ? Number.isNaN(bookingYear)
        : bookingYear === year;
}

/**
 * Calculates the sum of a specified numeric value derived from each element
 * in an array of booking entries.
 *
 * @param bookings - An array of booking entries to be processed.
 * @param sumFn - A function that extracts or computes the numeric value
 *                           from each booking entry to be included in the sum.
 * @returns The total sum of all extracted numeric values, rounded to two decimal places.
 */
function sumAll(
    bookings: BookingDb[],
    sumFn: (_entry: BookingDb) => number
): number {
    const sum = bookings.reduce((acc, entry) => acc + sumFn(entry), 0);
    return round2(sum);
}

/**
 * Calculates the total sum of a specified property for bookings in a given year.
 *
 * @param bookings - An array of booking entries to process.
 * @param year - The year for which bookings should be considered.
 * @param sumFn - A function that takes a booking entry as input and returns the numeric value to sum.
 * @returns The total sum of the specified property for bookings in the given year.
 */
function sumByYear(
    bookings: BookingDb[],
    year: number,
    sumFn: (_entry: BookingDb) => number
): number {
    const sum = bookings
        .filter((entry) => matchesBookingYear(entry, year))
        .reduce((acc, entry) => acc + sumFn(entry), 0);
    return round2(sum);
}