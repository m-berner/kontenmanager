import { INDEXED_DB } from "@/configs/database";
import { BaseRepository } from "./base";
export class AccountRepository extends BaseRepository {
    constructor(transactionManager) {
        super(INDEXED_DB.STORE.ACCOUNTS.NAME, transactionManager, new Map([["cIban", `${INDEXED_DB.STORE.ACCOUNTS.NAME}_uk1`]]));
    }
    async findByIBAN(iban) {
        const accounts = await this.findBy("cIban", iban);
        return accounts[0] || null;
    }
    async ibanExists(iban) {
        const account = await this.findByIBAN(iban);
        return !!account;
    }
}
