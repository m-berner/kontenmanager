/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {log} from "@/domain/utils/utils";

/**
 * Structural subset of the browser adapter needed to enforce a single app
 * tab; defined locally rather than importing the concrete `BrowserAdapter`
 * type so this module stays easy to unit-test with a plain mock.
 */
export type SingleTabGuardAdapter = {
    tabsGetCurrent: () => Promise<browser.tabs.Tab | undefined>;
    tabsQuery: () => Promise<browser.tabs.Tab[]>;
    tabsUpdate: (_tabId: number) => Promise<browser.tabs.Tab>;
    windowsUpdate: (_windowId: number) => Promise<browser.windows.Window>;
    removeTab: (_tabId: number) => Promise<void>;
};

/**
 * Picks which of several app tabs survives: the lowest tab id, always.
 *
 * Shared by {@link ensureSingleAppTab}, {@link closeDuplicateAppTab} and
 * `background.ts`'s toolbar-icon handler, so the three mechanisms cannot
 * disagree — and all three now apply it to the *same candidate pool*, every app
 * tab they can see, which is what makes agreement structural rather than
 * dependent on tab ids happening to be monotonic.
 *
 * `background.onClick` was a third survivor rule that the helper never reached:
 * it kept `tabs.query()[0]` and closed the rest, so with three app tabs after a
 * session restore a toolbar click focused an arbitrary one and closed the tab
 * the user had actually been working in — non-reproducibly, since the query
 * order is unspecified.
 *
 * `closeDuplicateAppTab` used to take
 * `otherTabs[0]` — whatever order `browser.tabs.query` happened to return —
 * while `ensureSingleAppTab` already reduced to the lowest id deliberately.
 * With exactly two app tabs both agree (only one candidate), but with three or
 * more — a session restore reopening several saved app tabs, which is a real
 * scenario — the background `tabs.onCreated` handler could keep tab B while
 * the surviving tab's own startup check concluded tab A survives, leaving the
 * two paths fighting over which tab lives.
 *
 * Callers must pass a non-empty list.
 */
export function pickSurvivor(tabs: browser.tabs.Tab[]): browser.tabs.Tab {
    return tabs.reduce((a, b) => ((a.id as number) < (b.id as number) ? a : b));
}

/**
 * Best-effort "focus the survivor, then close the other tab" sequence,
 * shared by {@link ensureSingleAppTab} and {@link closeDuplicateAppTab}.
 * Never throws — by the time either caller reaches this point, they've
 * already decided `tabIdToClose` must not stay open/mounted, regardless of
 * whether the courtesy focus step (or even the close itself) succeeds. A
 * failure here must not be allowed to leave two app tabs alive at once.
 */
async function focusThenClose(
    adapter: Pick<SingleTabGuardAdapter, "windowsUpdate" | "tabsUpdate" | "removeTab">,
    survivor: browser.tabs.Tab,
    tabIdToClose: number
): Promise<void> {
    try {
        if (survivor.windowId !== undefined) {
            await adapter.windowsUpdate(survivor.windowId);
        }
        if (survivor.id !== undefined) {
            await adapter.tabsUpdate(survivor.id);
        }
    } catch (focusErr) {
        log("ENTRYPOINTS singleTabGuard: failed to focus the surviving tab, closing the duplicate anyway", focusErr, "warn");
    }
    try {
        await adapter.removeTab(tabIdToClose);
    } catch (closeErr) {
        // Nothing more we can safely do here - the tab may end up stuck
        // open and unmounted (blank page) rather than closed. That's still
        // strictly better than mounting a second live app instance: the
        // user can close it manually, but two simultaneously-mounted tabs
        // would silently desync data.
        log("ENTRYPOINTS singleTabGuard: failed to close the duplicate tab", closeErr, "error");
    }
}

/**
 * Ensures at most one tab showing the extension's main app page is ever
 * open at once.
 *
 * Complements `background.ts`'s `onClick`/`onTabCreated` handlers, which
 * only clean up duplicate app tabs reactively — on a toolbar click, or the
 * instant a new tab's URL is known to already be the app's URL (see
 * {@link closeDuplicateAppTab}). Running this check at the app's own
 * startup also catches a tab opened any other way where the URL wasn't yet
 * known at creation time — e.g. a blank new tab manually navigated to the
 * app's URL, or a browser session restore reopening more than one
 * previously-saved app tab.
 *
 * Uses a deterministic tie-breaker (lowest tab id survives) rather than a
 * "whichever tab asks first wins" rule: two tabs opened at nearly the same
 * moment each run this check independently, but since both see the same
 * underlying tab list, both arrive at the same conclusion about who
 * survives — avoiding a race where either both tabs bow out (leaving
 * nothing open) or both consider themselves the survivor.
 *
 * @returns `true` if this tab is the sole/surviving app tab and startup
 *   should proceed to mount the app; `false` if this tab closed itself in
 *   favor of an already-open one and must not mount.
 */
export async function ensureSingleAppTab(adapter: SingleTabGuardAdapter): Promise<boolean> {
    try {
        const myTab = await adapter.tabsGetCurrent();
        if (myTab?.id === undefined) {
            // Not running inside an identifiable tab (e.g. an unusual
            // embedding context) - nothing to enforce, proceed normally.
            return true;
        }

        const appTabs = await adapter.tabsQuery();
        const otherTabs = appTabs.filter((tab) => tab.id !== undefined && tab.id !== myTab.id);
        if (otherTabs.length === 0) {
            return true;
        }

        const survivor = pickSurvivor([myTab, ...otherTabs]);

        if (survivor.id !== myTab.id) {
            log("ENTRYPOINTS singleTabGuard: another app tab already exists, closing this one", survivor.id);

            // Once we've determined this tab is NOT the survivor, it must not
            // mount, no matter what happens in focusThenClose() below. See
            // that function's own doc comment for why it can't fall through
            // to this function's outer catch's fail-open `return true`.
            await focusThenClose(adapter, survivor, myTab.id);
            return false;
        }

        // This tab is the survivor - clean up any other duplicate(s) too
        // (e.g. from a session restore reopening several saved app tabs).
        for (const tab of otherTabs) {
            if (tab.id !== undefined) {
                await adapter.removeTab(tab.id);
            }
        }
        return true;
    } catch (err) {
        // Never block the app from starting over a best-effort dedup check.
        log("ENTRYPOINTS singleTabGuard: check failed, proceeding to mount", err, "warn");
        return true;
    }
}

/**
 * Reactively closes a just-created duplicate app tab and focuses the
 * existing one, instead of waiting for the duplicate's own `app.ts`
 * bootstrap to notice via {@link ensureSingleAppTab}. Meant to be called
 * from `background.ts`'s `browser.tabs.onCreated` listener, only for tabs
 * already confirmed to be showing the app's URL.
 *
 * This is what makes the browser's native "Duplicate Tab" context-menu
 * action (which copies the source tab's URL onto the new tab immediately,
 * unlike a blank new tab) not leave a second live app tab open even
 * briefly — there's no WebExtension API to remove or disable that native
 * menu item itself, so this reacts to its result instead, faster than
 * waiting for the duplicate to load and run its own startup check.
 *
 * @param adapter - Same structural dependency subset as
 *   {@link ensureSingleAppTab}; `tabsGetCurrent` is unused here since the
 *   newly created tab is passed in directly, not looked up.
 * @param newTab - The tab reported by `browser.tabs.onCreated`, already
 *   confirmed by the caller to be an app tab.
 */
export async function closeDuplicateAppTab(
    adapter: SingleTabGuardAdapter,
    newTab: browser.tabs.Tab
): Promise<void> {
    if (newTab.id === undefined) return;
    const newTabId = newTab.id;

    try {
        const appTabs = await adapter.tabsQuery();
        const otherTabs = appTabs.filter((tab) => tab.id !== undefined && tab.id !== newTabId);
        if (otherTabs.length === 0) {
            return; // The only app tab open - nothing to do.
        }

        // Same rule AND the same candidate pool as ensureSingleAppTab: the new
        // tab is included. It used to be excluded, so this function could never
        // choose to keep it — which reconciled with `ensureSingleAppTab` (which
        // would keep it, if it held the lowest id) only through an unstated
        // assumption: that a newly created tab always has a higher id than every
        // existing one. True for monotonic tab ids, which is the normal case.
        //
        // Were it ever violated — id reuse after a restart, a restored tab
        // receiving a low id — the two paths actively fought: this handler
        // closed the new tab as a duplicate while that tab's own startup check
        // concluded it was the survivor and closed the others. Both run, and
        // every app tab ends up closed. Sharing the pool makes the agreement
        // structural rather than conditional on tab-id behaviour.
        const survivor = pickSurvivor([newTab, ...otherTabs]);

        if (survivor.id === newTabId) {
            log(
                "ENTRYPOINTS singleTabGuard: new tab outranks the open app tab(s), closing those instead",
                newTabId
            );
            for (const tab of otherTabs) {
                if (tab.id !== undefined) {
                    await adapter.removeTab(tab.id);
                }
            }
            return;
        }

        log(
            "ENTRYPOINTS singleTabGuard: new tab duplicates an already-open app tab, closing it",
            survivor.id
        );
        await focusThenClose(adapter, survivor, newTabId);
    } catch (err) {
        // Best-effort only - if this check fails, ensureSingleAppTab() still
        // runs once the duplicate itself loads and catches it there instead.
        log("ENTRYPOINTS singleTabGuard: closeDuplicateAppTab check failed", err, "warn");
    }
}
