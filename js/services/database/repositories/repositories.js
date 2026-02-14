import { INDEXED_DB } from "@/configs/database";
import { BaseRepository } from "../base";
import { DomainUtils } from "@/domains/utils";
export class AccountRepository extends BaseRepository {
    async getAll(tx) {
        return super._getAll(INDEXED_DB.STORE.ACCOUNTS.NAME, tx);
    }
    async delete(accountId, tx) {
        return super._delete(INDEXED_DB.STORE.ACCOUNTS.NAME, accountId, tx);
    }
}
export class BookingRepository extends BaseRepository {
    async getAllByAccount(accountId, tx) {
        return super._getAllByAccount(INDEXED_DB.STORE.BOOKINGS.NAME, `${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`, accountId, tx);
    }
    async deleteByAccount(accountId, tx) {
        return super._deleteByAccount(INDEXED_DB.STORE.BOOKINGS.NAME, `${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`, accountId, tx);
    }
}
export class BookingTypeRepository extends BaseRepository {
    async getAllByAccount(accountId, tx) {
        return super._getAllByAccount(INDEXED_DB.STORE.BOOKING_TYPES.NAME, `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`, accountId, tx);
    }
    async deleteByAccount(accountId, tx) {
        return super._deleteByAccount(INDEXED_DB.STORE.BOOKING_TYPES.NAME, `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`, accountId, tx);
    }
}
export class StockRepository extends BaseRepository {
    async getAllByAccount(accountId, tx) {
        return super._getAllByAccount(INDEXED_DB.STORE.STOCKS.NAME, `${INDEXED_DB.STORE.STOCKS.NAME}_k3`, accountId, tx);
    }
    async deleteByAccount(accountId, tx) {
        return super._deleteByAccount(INDEXED_DB.STORE.STOCKS.NAME, `${INDEXED_DB.STORE.STOCKS.NAME}_k3`, accountId, tx);
    }
}
DomainUtils.log("SERVICES DATABASE REPOSITORIES (Refactored)");
