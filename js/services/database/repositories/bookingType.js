import { INDEXED_DB } from "@/configs/database";
import { BaseRepository } from "./base";
export class BookingTypeRepository extends BaseRepository {
    constructor(transactionManager) {
        super(INDEXED_DB.STORE.BOOKING_TYPES.NAME, transactionManager, new Map([
            ["cAccountNumberID", `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`]
        ]));
    }
    async findByAccount(accountId, options = {}) {
        return this.findBy("cAccountNumberID", accountId, options);
    }
    async deleteByAccount(accountId, options = {}) {
        return this.deleteBy("cAccountNumberID", accountId, options);
    }
    async countByAccount(accountId) {
        const bookingTypes = await this.findByAccount(accountId);
        return bookingTypes.length;
    }
}
