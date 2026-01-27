import { INDEXED_DB } from "@/config/database";
import { IndexedDbBase } from "../base";
export class AccountRepository {
    _dbBase;
    constructor(_dbBase) {
        this._dbBase = _dbBase;
    }
    async getAll(tx) {
        return this._dbBase.getAll(INDEXED_DB.STORE.ACCOUNTS.NAME, tx);
    }
    async delete(accountId, tx) {
        return this._dbBase.remove(INDEXED_DB.STORE.ACCOUNTS.NAME, accountId, tx);
    }
}
