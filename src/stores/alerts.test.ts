/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useAlertStore} from "./alerts";

// Mock DomainUtils to keep test output clean and assert on warnings/errors if needed
vi.mock("@/domains/utils", () => ({
    DomainUtils: {
        log: vi.fn()
    }
}));

describe("Alert Store", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.useFakeTimers();
    });

    it("showAlert should enqueue and set current alert", () => {
        const store = useAlertStore();

        const id = store.showAlert(
            "success",
            "Saved",
            "Your changes were saved",
            null
        );

        expect(id).toBeGreaterThan(0);
        expect(store.showOverlay).toBe(true);
        expect(store.alertTitle).toBe("Saved");
        expect(store.alertMessage).toBe("Your changes were saved");
        expect(store.alertType).toBe("success");
        expect(store.pendingCount).toBe(0);
    });

    it("auto-dismiss should advance the queue", () => {
        const store = useAlertStore();

        const firstId = store.showAlert("info", "A1", "m1", 1000);
        store.showAlert("info", "A2", "m2", null);

        // First becomes current
        expect(store.alertTitle).toBe("A1");
        expect(store.pendingCount).toBe(1);

        // Fast-forward timers to trigger auto-dismiss
        vi.advanceTimersByTime(1000);

        // After dismissal, second becomes current
        expect(store.alertTitle).toBe("A2");
        expect(store.pendingCount).toBe(0);

        // Dismissing an already-dismissed ID should not throw and produce a warning
        expect(() => store.dismissAlert(firstId)).not.toThrow();
    });

    it("dismissAlert should handle undefined and missing IDs gracefully", async () => {
        const store = useAlertStore();
        const {DomainUtils} = await import("@/domains/utils");

        // Undefined ID
        store.dismissAlert(undefined);
        expect(DomainUtils.log).toHaveBeenCalled();

        // Missing ID
        store.dismissAlert(9999);
        expect(DomainUtils.log).toHaveBeenCalled();
    });

    it("confirm should resolve/reject and toggle dialog visibility", async () => {
        const store = useAlertStore();

        const promise = store.confirm("Delete", "Are you sure?", {
            confirmText: "Yes",
            cancelText: "No",
            type: "warning"
        });

        // Dialog should be visible
        expect(store.showConfirmation).toBe(true);

        // Confirm action
        store.handleConfirm();
        await expect(promise).resolves.toBe(true);

        // Dialog hidden after resolve
        expect(store.showConfirmation).toBe(false);

        // Trigger another and cancel
        const promise2 = store.confirm("Delete", "Are you sure?");
        expect(store.showConfirmation).toBe(true);
        store.handleCancel();
        await expect(promise2).resolves.toBe(false);
        expect(store.showConfirmation).toBe(false);
    });

    it("clearAll should cancel timeouts and reset state", () => {
        const store = useAlertStore();

        store.showAlert("info", "T1", "M1", 5000);
        store.showAlert("warning", "T2", "M2", null);

        expect(store.showOverlay).toBe(true);
        expect(store.pendingCount).toBe(1);

        store.clearAll();

        // After clear, no overlay or confirmation dialog
        expect(store.showOverlay).toBe(false);
        expect(store.pendingCount).toBe(0);
        expect(store.showConfirmation).toBe(false);
    });
});
