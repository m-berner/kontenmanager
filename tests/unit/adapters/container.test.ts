/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";

// Every driven factory is stubbed: this file is about the container's *wiring*,
// not about any adapter's behaviour, and constructing the real database/fetch
// adapters here would pull in IndexedDB and the network for no benefit.
const createAppAdapter = vi.fn(() => ({kind: "appAdapter"}));

vi.mock("@/adapters/driven/appAdapter", () => ({createAppAdapter}));
vi.mock("@/adapters/driven/alertAdapter", () => ({createAlertAdapter: () => ({kind: "alert"})}));
vi.mock("@/adapters/driven/browserAdapter", () => ({createBrowserAdapter: () => ({kind: "browser"})}));
vi.mock("@/adapters/driven/database/databaseAdapter", () => ({
    createDatabaseAdapter: () => ({getAllRepositories: () => ({kind: "repositories"})})
}));
vi.mock("@/adapters/driven/faviconAdapter", () => ({createFaviconAdapter: () => ({kind: "favicon"})}));
vi.mock("@/adapters/driven/fetchAdapter", () => ({createFetchAdapter: () => ({kind: "fetch"})}));
vi.mock("@/adapters/driven/importExportAdapter", () => ({createImportExportAdapter: () => ({kind: "importExport"})}));
vi.mock("@/adapters/driven/taskAdapter", () => ({createTaskAdapter: () => ({kind: "task"})}));
vi.mock("@/adapters/ui/validationAdapter", () => ({createValidationAdapter: () => ({kind: "validation"})}));
vi.mock("@/adapters/driven/storageAdapter", () => ({storageAdapter: {kind: "real-storage"}}));

const {createAdapters} = await import("@/adapters/container");
type StorageOverride = Parameters<typeof createAdapters>[0] extends infer O
    ? O extends {storageAdapter?: infer S} ? S : never
    : never;

describe("adapters/container", () => {
    beforeEach(() => {
        createAppAdapter.mockClear();
    });

    // README.md's Architecture section §8.1 states that `overrides` "accepts test doubles for any
    // adapter". `storageAdapter` was declared on AdaptersOverrides and then
    // never read: the module import was used bare in both places, so a test
    // double type-checked, was accepted, and the real `browser.storage.local`
    // wrapper was handed back — including to `createAppAdapter`, whose Phase 1
    // (`initializeStorage`) is the one thing a storage double exists to control.
    it("honours a storageAdapter override in the returned container", () => {
        const fake = {kind: "fake-storage"} as unknown as StorageOverride;

        const adapters = createAdapters({storageAdapter: fake});

        expect(adapters.storageAdapter).toBe(fake);
    });

    it("passes the storageAdapter override through to createAppAdapter", () => {
        const fake = {kind: "fake-storage"} as unknown as StorageOverride;

        createAdapters({storageAdapter: fake});

        expect(createAppAdapter).toHaveBeenCalledWith(
            expect.objectContaining({storageAdapter: fake})
        );
    });

    it("falls back to the real storageAdapter when no override is given", () => {
        const adapters = createAdapters();

        expect(adapters.storageAdapter).toEqual({kind: "real-storage"});
        expect(createAppAdapter).toHaveBeenCalledWith(
            expect.objectContaining({storageAdapter: {kind: "real-storage"}})
        );
    });
});
