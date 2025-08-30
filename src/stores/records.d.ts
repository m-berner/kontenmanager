import type { IAccount, IBooking, IBookingType, IStockStore, IStores } from '@/index';
interface IRecordsStore {
    accounts: IAccount[];
    bookings: IBooking[];
    bookingTypes: IBookingType[];
    stocks: IStockStore[];
    bookingSum: number;
    totalController: Record<string, number>;
}
export declare const useRecordsStore: import("pinia").StoreDefinition<"records", IRecordsStore, {
    getAccountById: (state: {
        accounts: any;
        bookings: any;
        bookingTypes: any;
        stocks: any;
        bookingSum: number;
        totalController: Record<string, number>;
    } & import("pinia").PiniaCustomStateProperties<IRecordsStore>) => (id: number) => IAccount | undefined;
    getBookingByAccountId: (state: {
        accounts: any;
        bookings: any;
        bookingTypes: any;
        stocks: any;
        bookingSum: number;
        totalController: Record<string, number>;
    } & import("pinia").PiniaCustomStateProperties<IRecordsStore>) => (accountId: number) => IBooking[];
    getBookingTextById: (state: {
        accounts: any;
        bookings: any;
        bookingTypes: any;
        stocks: any;
        bookingSum: number;
        totalController: Record<string, number>;
    } & import("pinia").PiniaCustomStateProperties<IRecordsStore>) => (ident: number) => string;
}, {
    getAccountIndexById(ident: number): number;
    getBookingTypeNameById(ident: number): string;
    getBookingTypeById(ident: number): number;
    getBookingTextByIdd(ident: number): string;
    getBookingById(ident: number): number;
    getStockById(ident: number): number;
    sumBookings(): void;
    initStore(stores: IStores): void;
    setBookingSum(value: number): void;
    addAccount(account: IAccount): void;
    updateAccount(account: IAccount): void;
    deleteAccount(ident: number): void;
    addBooking(booking: IBooking): void;
    deleteBooking(ident: number): void;
    addStock(stock: IStockStore): void;
    updateStock(stock: IStockStore): void;
    updateBooking(booking: IBooking): void;
    deleteStock(ident: number): void;
    addBookingType(bookingType: IBookingType): void;
    deleteBookingType(ident: number): void;
    cleanStore(): void;
}>;
export {};
//# sourceMappingURL=records.d.ts.map