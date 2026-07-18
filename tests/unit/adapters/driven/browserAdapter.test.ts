/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {createBrowserAdapter} from "@/adapters/driven/browserAdapter";

describe("browserAdapter.writeBufferToFile", () => {
    let onChangedListeners: Array<(_change: {id: number; state?: {current: string}}) => void>;
    let downloadMock: ReturnType<typeof vi.fn>;
    let revokeObjectURLMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onChangedListeners = [];
        downloadMock = vi.fn().mockResolvedValue(42);

        (globalThis as unknown as {browser: unknown}).browser = {
            downloads: {
                download: downloadMock,
                onChanged: {
                    addListener: vi.fn((cb: (typeof onChangedListeners)[number]) => {
                        onChangedListeners.push(cb);
                    }),
                    removeListener: vi.fn((cb: (typeof onChangedListeners)[number]) => {
                        onChangedListeners = onChangedListeners.filter((l) => l !== cb);
                    })
                }
            }
        };

        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
        revokeObjectURLMock = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {
        });
    });

    afterEach(() => {
        delete (globalThis as unknown as {browser?: unknown}).browser;
        vi.restoreAllMocks();
    });

    it("ignores onChanged events for other downloads", async () => {
        const adapter = createBrowserAdapter();
        await adapter.writeBufferToFile("{}", "backup.json");

        expect(onChangedListeners).toHaveLength(1);

        // An unrelated download (different id) completing must not revoke
        // this call's blob URL.
        onChangedListeners[0]({id: 999, state: {current: "complete"}});

        expect(revokeObjectURLMock).not.toHaveBeenCalled();
        expect(onChangedListeners).toHaveLength(1);
    });

    it("revokes the blob URL and removes the listener once its own download completes", async () => {
        const adapter = createBrowserAdapter();
        await adapter.writeBufferToFile("{}", "backup.json");

        expect(downloadMock).toHaveBeenCalledTimes(1);
        onChangedListeners[0]({id: 42, state: {current: "complete"}});

        expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
        expect(onChangedListeners).toHaveLength(0);
    });
});
