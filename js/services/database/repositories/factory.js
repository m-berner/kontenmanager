import { AccountRepository } from "./account";
import { BookingRepository } from "./booking";
import { BookingTypeRepository } from "./bookingType";
import { StockRepository } from "./stock";
export class RepositoryFactory {
    transactionManager;
    repositories = {};
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
    }
    getRepository(type) {
        if (!this.repositories[type]) {
            this.repositories[type] = this.createRepository(type);
        }
        return this.repositories[type];
    }
    getAllRepositories() {
        return {
            accounts: this.getRepository("accounts"),
            bookings: this.getRepository("bookings"),
            bookingTypes: this.getRepository("bookingTypes"),
            stocks: this.getRepository("stocks")
        };
    }
    createRepository(type) {
        switch (type) {
            case "accounts":
                return new AccountRepository(this.transactionManager);
            case "bookings":
                return new BookingRepository(this.transactionManager);
            case "bookingTypes":
                return new BookingTypeRepository(this.transactionManager);
            case "stocks":
                return new StockRepository(this.transactionManager);
            default:
                throw new Error(`Unknown repository type: ${type}`);
        }
    }
    clearCache() {
        this.repositories = {};
    }
}
