import { type ThemeInstance } from 'vuetify';
interface ISettingsStore {
    skin: string;
    bookingsPerPage: number;
    stocksPerPage: number;
    activeAccountId: number;
    partner: boolean;
    service: string;
    materials: string[];
    markets: string[];
    indexes: string[];
    exchanges: string[];
}
export declare const useSettingsStore: import("pinia").StoreDefinition<"settings", ISettingsStore, {
    hasActiveAccount: (state: {
        skin: string;
        bookingsPerPage: number;
        stocksPerPage: number;
        activeAccountId: number;
        partner: boolean;
        service: string;
        materials: string[];
        markets: string[];
        indexes: string[];
        exchanges: string[];
    } & import("pinia").PiniaCustomStateProperties<ISettingsStore>) => boolean;
}, {
    setActiveAccountId(value: number): void;
    setBookingsPerPage(value: number): void;
    setStocksPerPage(value: number): void;
    setPartner(value: boolean): void;
    setService(value: string): void;
    setMaterials(value: string[]): void;
    setMarkets(value: string[]): void;
    setIndexes(value: string[]): void;
    setExchanges(value: string[]): void;
    setSkin(theme: ThemeInstance, value: string): void;
    initStore(theme: ThemeInstance, storage: {
        [p: string]: string | number | boolean | string[];
    }): void;
    updatePagination(bookings: number, stocks: number): void;
    updateMarketData(data: Partial<{
        materials: string[];
        markets: string[];
        indexes: string[];
        exchanges: string[];
    }>): void;
    validateSettings(): boolean;
}>;
export {};
//# sourceMappingURL=settings.d.ts.map