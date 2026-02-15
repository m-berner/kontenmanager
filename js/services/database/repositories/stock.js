import { INDEXED_DB } from "@/configs/database";
import { BaseRepository } from "./base";
export class StockRepository extends BaseRepository {
    constructor(transactionManager) {
        super(INDEXED_DB.STORE.STOCKS.NAME, transactionManager, new Map([
            ["cISIN", `${INDEXED_DB.STORE.STOCKS.NAME}_uk1`],
            ["cSymbol", `${INDEXED_DB.STORE.STOCKS.NAME}_uk2`],
            ["cFadeOut", `${INDEXED_DB.STORE.STOCKS.NAME}_k1`],
            ["cFirstPage", `${INDEXED_DB.STORE.STOCKS.NAME}_k2`],
            ["cAccountNumberID", `${INDEXED_DB.STORE.STOCKS.NAME}_k3`]
        ]));
    }
    async findByAccount(accountId, options = {}) {
        return this.findBy("cAccountNumberID", accountId, options);
    }
    async deleteByAccount(accountId, options = {}) {
        return this.deleteBy("cAccountNumberID", accountId, options);
    }
    async countByAccount(accountId) {
        const stocks = await this.findByAccount(accountId);
        return stocks.length;
    }
}
