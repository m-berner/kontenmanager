/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";

const mapStockForm = vi.fn().mockReturnValue({mapped: "stock"});
const mapAccountForm = vi.fn().mockReturnValue({mapped: "account"});
const mapBookingForm = vi.fn().mockReturnValue({mapped: "booking"});
const mapBookingTypeForm = vi.fn().mockReturnValue({mapped: "bookingType"});

vi.mock("@/domain/mapping/formMapper", () => ({
    formMapper: () => ({mapStockForm, mapAccountForm, mapBookingForm, mapBookingTypeForm})
}));

import {
    createAccountFormManager,
    createBookingFormManager,
    createBookingTypeFormManager,
    createStockFormManager,
    useAccountForm,
    useBookingForm,
    useBookingTypeForm,
    useStockForm
} from "@/adapters/ui/composables/useForms";

describe("useForms", () => {
    describe("createStockFormManager", () => {
        it("starts with the documented default field values", () => {
            const {stockFormData} = createStockFormManager();
            expect(stockFormData.id).toBe(-1);
            expect(stockFormData.isin).toBe("");
            expect(stockFormData.fadeOut).toBe(0);
        });

        it("reset() restores the form to its initial values after mutation", () => {
            const {stockFormData, reset} = createStockFormManager();
            stockFormData.isin = "US1234567890";
            stockFormData.company = "Test Inc.";

            reset();

            expect(stockFormData.isin).toBe("");
            expect(stockFormData.company).toBe("");
        });

        it("mapStockFormToDb forwards the current form data and accountId to the mapper", () => {
            const {stockFormData, mapStockFormToDb} = createStockFormManager();
            stockFormData.isin = "US1234567890";

            const result = mapStockFormToDb(7);

            expect(mapStockForm).toHaveBeenCalledWith(
                expect.objectContaining({isin: "US1234567890"}),
                7
            );
            expect(result).toEqual({mapped: "stock"});
        });
    });

    describe("createAccountFormManager", () => {
        it("mapAccountFormToDb forwards the current form data to the mapper", () => {
            const {accountFormData, mapAccountFormToDb} = createAccountFormManager();
            accountFormData.iban = "DE1234567890";

            mapAccountFormToDb();

            expect(mapAccountForm).toHaveBeenCalledWith(
                expect.objectContaining({iban: "DE1234567890"})
            );
        });
    });

    describe("createBookingFormManager", () => {
        it("mapBookingFormToDb forwards form data, accountId, and the default ISO date", () => {
            const {bookingFormData, mapBookingFormToDb} = createBookingFormManager();
            bookingFormData.description = "Test booking";

            mapBookingFormToDb(3, "2026-01-01");

            expect(mapBookingForm).toHaveBeenCalledWith(
                expect.objectContaining({description: "Test booking"}),
                3,
                "2026-01-01"
            );
        });
    });

    describe("createBookingTypeFormManager", () => {
        it("starts with a null id (distinguishes add from update)", () => {
            const {bookingTypeFormData} = createBookingTypeFormManager();
            expect(bookingTypeFormData.id).toBeNull();
        });

        it("mapBookingTypeFormToDb forwards form data and accountId to the mapper", () => {
            const {bookingTypeFormData, mapBookingTypeFormToDb} = createBookingTypeFormManager();
            bookingTypeFormData.name = "Buy";

            mapBookingTypeFormToDb(5);

            expect(mapBookingTypeForm).toHaveBeenCalledWith(
                expect.objectContaining({name: "Buy"}),
                5
            );
        });
    });

    describe("useXForm() without a preceding provide*FormManager()", () => {
        it("useStockForm throws a descriptive error", () => {
            expect(() => useStockForm()).toThrow(/StockFormManager/);
        });

        it("useAccountForm throws a descriptive error", () => {
            expect(() => useAccountForm()).toThrow(/AccountFormManager/);
        });

        it("useBookingForm throws a descriptive error", () => {
            expect(() => useBookingForm()).toThrow(/BookingFormManager/);
        });

        it("useBookingTypeForm throws a descriptive error", () => {
            expect(() => useBookingTypeForm()).toThrow(/BookingTypeFormManager/);
        });
    });
});