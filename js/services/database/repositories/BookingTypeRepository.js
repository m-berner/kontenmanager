import { INDEXED_DB } from "@/config/database";
import { IndexedDbBase } from "../base";
export class BookingTypeRepository {
    _dbBase;
    constructor(_dbBase) {
        this._dbBase = _dbBase;
    }
    async getAllByAccount(accountId, tx) {
        return this._dbBase.getAllByIndex(INDEXED_DB.STORE.BOOKING_TYPES.NAME, `${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`, accountId, tx);
    }
    async deleteByAccount(accountId, tx) {
        const store = tx.objectStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME);
        const index = store.index(`${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`);
        return this._dbBase.deleteByCursor(index, IDBKeyRange.only(accountId));
    }
}
