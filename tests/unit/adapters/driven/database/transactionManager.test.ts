/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {createTransactionManager} from "@/adapters/driven/database/transactionManager";
import {appError, ERROR_DEFINITIONS, isAppError} from "@/domain/errors";
import {ERROR_CATEGORY} from "@/domain/constants";
import type {DatabaseConnection} from "@/domain/types";

type FakeTx = {
    oncomplete: (() => void) | null;
    onerror: (() => void) | null;
    onabort: (() => void) | null;
    error: unknown;
    abort: ReturnType<typeof vi.fn>;
};

function createFakeTx(): FakeTx {
    const tx: FakeTx = {
        oncomplete: null,
        onerror: null,
        onabort: null,
        error: null,
        abort: vi.fn()
    };
    // Real IndexedDB fires onabort asynchronously once abort() is called;
    // model that (synchronously, for test simplicity) so timeout/error paths
    // that depend on an in-flight request rejecting on abort behave the same
    // as production.
    tx.abort.mockImplementation(() => {
        tx.onabort?.();
    });
    return tx;
}

async function flushMicrotasks(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

describe("TransactionManager", () => {
    let tx: FakeTx;
    let transactionMock: ReturnType<typeof vi.fn>;
    let connection: DatabaseConnection;

    beforeEach(() => {
        tx = createFakeTx();
        transactionMock = vi.fn().mockReturnValue(tx);
        connection = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            isConnected: vi.fn().mockReturnValue(true),
            getDatabase: vi.fn().mockReturnValue({transaction: transactionMock} as unknown as IDBDatabase),
            onVersionChange: vi.fn()
        };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("executes the operation and resolves with its result once the transaction completes", async () => {
        const manager = createTransactionManager(connection);
        const operation = vi.fn().mockResolvedValue("result");

        const promise = manager.execute("accounts", "readonly", operation);
        await flushMicrotasks();
        tx.oncomplete?.();

        await expect(promise).resolves.toBe("result");
        expect(transactionMock).toHaveBeenCalledWith(["accounts"], "readonly");
        expect(operation).toHaveBeenCalledWith(tx);
    });

    it("throws an AppError immediately when not connected", async () => {
        (connection.isConnected as ReturnType<typeof vi.fn>).mockReturnValue(false);
        const manager = createTransactionManager(connection);

        await expect(
            manager.execute("accounts", "readonly", vi.fn())
        ).rejects.toThrow();
        expect(transactionMock).not.toHaveBeenCalled();
    });

    it("aborts the transaction and wraps a plain error thrown by the operation", async () => {
        const manager = createTransactionManager(connection);
        const operation = vi.fn().mockRejectedValue(new Error("boom"));

        const promise = manager.execute("accounts", "readwrite", operation);

        await expect(promise).rejects.toThrow();
        expect(tx.abort).toHaveBeenCalled();
    });

    it("passes through an AppError thrown by the operation without rewrapping it", async () => {
        const manager = createTransactionManager(connection);
        const original = appError(
            ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.I.CODE,
            ERROR_CATEGORY.DATABASE,
            false
        );
        const operation = vi.fn().mockRejectedValue(original);

        const promise = manager.execute("accounts", "readwrite", operation);

        await expect(promise).rejects.toBe(original);
    });

    it("rejects and aborts when the transaction reports onerror instead of completing", async () => {
        const manager = createTransactionManager(connection);
        const operation = vi.fn().mockResolvedValue("result");

        const promise = manager.execute("accounts", "readwrite", operation);
        await flushMicrotasks();
        tx.error = new Error("tx failed");
        tx.onerror?.();

        const caught = await promise.catch((e) => e);
        expect(isAppError(caught)).toBe(true);
        expect(tx.abort).toHaveBeenCalled();
    });

    it("rejects with a TRANSACTION_FAILED AppError when the transaction aborts spontaneously", async () => {
        const manager = createTransactionManager(connection);
        const operation = vi.fn().mockResolvedValue("result");

        const promise = manager.execute("accounts", "readwrite", operation);
        await flushMicrotasks();
        tx.onabort?.();

        const caught = await promise.catch((e) => e);
        expect(isAppError(caught)).toBe(true);
    });

    it("aborts the transaction once the configured timeout elapses", async () => {
        vi.useFakeTimers();
        const manager = createTransactionManager(connection);
        // Simulate an in-flight IDBRequest that only settles once the
        // transaction is aborted (as a real pending request would).
        const operation = vi.fn(
            (txArg: IDBTransaction) =>
                new Promise((_resolve, reject) => {
                    (txArg as unknown as FakeTx).onabort = () => reject(new Error("aborted by timeout"));
                })
        );

        const promise = manager.execute("accounts", "readonly", operation, {timeout: 5000});

        vi.advanceTimersByTime(5000);
        expect(tx.abort).toHaveBeenCalled();

        await expect(promise).rejects.toThrow();
    });

    it("does not abort the transaction if it completes before the timeout", async () => {
        vi.useFakeTimers();
        const manager = createTransactionManager(connection);
        const operation = vi.fn().mockResolvedValue("done");

        const promise = manager.execute("accounts", "readonly", operation, {timeout: 5000});
        await flushMicrotasks();
        tx.oncomplete?.();
        await promise;

        vi.advanceTimersByTime(5000);
        expect(tx.abort).not.toHaveBeenCalled();
    });

    it("reports progress phases in order", async () => {
        const manager = createTransactionManager(connection);
        const operation = vi.fn().mockResolvedValue("result");
        const phases: string[] = [];

        const promise = manager.execute("accounts", "readonly", operation, {
            onProgress: (p) => phases.push(p.phase)
        });
        await flushMicrotasks();
        tx.oncomplete?.();
        await promise;

        expect(phases).toEqual(["started", "executing", "completing", "completed"]);
    });

    it("executeMultiple runs operations in order within a single transaction and collects results", async () => {
        const manager = createTransactionManager(connection);
        const op1 = vi.fn().mockResolvedValue(1);
        const op2 = vi.fn().mockResolvedValue(2);

        const promise = manager.executeMultiple("accounts", "readwrite", [op1, op2]);
        await flushMicrotasks();
        tx.oncomplete?.();

        await expect(promise).resolves.toEqual([1, 2]);
        expect(transactionMock).toHaveBeenCalledTimes(1);
        expect(op1).toHaveBeenCalledWith(tx);
        expect(op2).toHaveBeenCalledWith(tx);
    });
});