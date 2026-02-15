import { INDEXED_DB } from "@/configs/database";
import { BaseRepository } from "./base";
export class BookingRepository extends BaseRepository {
    constructor(transactionManager) {
        super(INDEXED_DB.STORE.BOOKINGS.NAME, transactionManager, new Map([
            ["cBookDate", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k1`],
            ["cBookingTypeID", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k2`],
            ["cAccountNumberID", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`],
            ["cStockID", `${INDEXED_DB.STORE.BOOKINGS.NAME}_k4`]
        ]));
    }
    async findByAccount(accountId, options = {}) {
        return this.findBy("cAccountNumberID", accountId, options);
    }
    async findByDate(date, options = {}) {
        return this.findBy("cBookDate", date, options);
    }
    async findByBookingType(bookingTypeId, options = {}) {
        return this.findBy("cBookingTypeID", bookingTypeId, options);
    }
    async findByStock(stockId, options = {}) {
        return this.findBy("cStockID", stockId, options);
    }
    async deleteByAccount(accountId, options = {}) {
        return this.deleteBy("cAccountNumberID", accountId, options);
    }
    async countByAccount(accountId) {
        const bookings = await this.findByAccount(accountId);
        return bookings.length;
    }
}
