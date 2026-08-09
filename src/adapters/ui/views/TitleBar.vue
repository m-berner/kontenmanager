<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

import {BROWSER_STORAGE, INDEXED_DB} from "@/domain/constants";
import type {ViewTypeSelectionType} from "@/domain/types";
import {sanitizeExternalUrl} from "@/domain/utils/url";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import defaultIcon from "@/adapters/ui/assets/icon48.png";
// Imported, not a path constant: Vite rewrites this to the built asset's real
// URL, so it cannot go stale if `assetsDir`, the entrypoint's depth or asset
// hashing ever changes. Same idiom as `defaultIcon` above — there used to be two
// idioms for this one job, and the unmanaged one is what produced the broken
// notification icon path (ISSUES_II 8.1).
import titleBarLogo from "@/adapters/ui/assets/icon64.png";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const COMPANY: ViewTypeSelectionType = "company";

const {n, t} = useI18n();
const records = useRecordsStore();
const settings = useSettingsStore();
const runtime = useRuntimeStore();
const {databaseAdapter, alertAdapter, fetchAdapter, storageAdapter} = useAdapters();
const {setStorage} = storageAdapter();

let depotTimer: number | undefined;
let accountUpdateSeq = 0;
let probeController: AbortController | null = null;
let probeSeq = 0;

/**
 * The account id to revert to when a switch fails partway.
 *
 * Read once at setup and thereafter updated only on a fully successful switch —
 * which left it stale, because `settings.activeAccountId` has **three other
 * writers**, none of which touched it: the cross-context storage listener
 * (`stores/settings.ts` `applyStorageChange`, when the options page changes it),
 * `importDatabaseUsecase` via `setActiveAccountIdPersisted`, and
 * `useImportDialog`'s rollback path. If the active account changed through any
 * of those while this component stayed mounted and the user then attempted a
 * switch that failed at `setStorage`, the revert restored the account from
 * component setup — not the one that was actually active — silently moving the
 * user to a *third* account and re-hydrating the stores to match.
 *
 * The watcher below closes that. `switchInFlight` is what makes it safe: during
 * a switch the v-model has already applied the optimistic new id, and adopting
 * that as the revert target would defeat the whole mechanism. Outside a switch,
 * any change is by definition someone else's confirmed write, so following it is
 * exactly right.
 */
let lastConfirmedAccountId = settings.activeAccountId;
let switchInFlight = 0;

watch(
    () => settings.activeAccountId,
    (next) => {
      if (switchInFlight === 0) {
        lastConfirmedAccountId = next;
      }
    }
);

const connectionState = ref<"checking" | "online" | "offline">("checking");
const showDepotChip = ref(false);

/**
 * A computed property that determines the URL of the logo to be displayed for the
 * active account.
 *
 * - If an account with the active account ID is found in the `records.accounts.items`, it returns the
 *   `cLogoUrl` of that account.
 * - If no account is found or the `cLogoUrl` is not available, it returns the `defaultIcon`.
 *
 * Deliberately independent of `connectionState`. It used to return a plug icon
 * while checking or offline, which meant the connectivity status had no surface
 * of its own: it was readable only as the *absence* of the bank logo, only
 * inside the account switcher, and therefore not at all when no account existed
 * to render a switcher. The app bar now carries a dedicated indicator
 * (`connectionIcon` below), so this is back to one job — identifying the
 * account.
 */
const logoUrl = computed((): string => {
  const account = records.accounts.items.find(
      (a) => a.cID === settings.activeAccountId
  );

  // Sanitized rather than bound raw. Through the UI this is already safe — the
  // field has no text input, `AccountForm` writes `logoUrl` only from
  // `faviconAdapter`'s constructed Google/DuckDuckGo URLs — but through *import*
  // it is not: a backup sets `cLogoUrl` to any string, `validateAccount` runs
  // only `normalizeString` on it, and this renders it on every app load for the
  // active account. So opening a backup shared by someone else made the
  // extension issue an automatic request to a host of that person's choosing: a
  // load-time signal that the file was opened, from the extension's own context.
  //
  // The severity ceiling is low — `<img>` does not execute `javascript:`, and
  // scripts inside an SVG loaded via `<img>` do not run either — so the concern
  // is the unsolicited outbound request, not code execution. Falling back to
  // `defaultIcon` means a rejected URL is indistinguishable from an unset one,
  // which is the right outcome for a decorative element.
  return sanitizeExternalUrl(account?.cLogoUrl) ?? defaultIcon;
});

/** Icon alias for the current connectivity state — one glyph per state. */
const connectionIcon = computed((): string => {
  switch (connectionState.value) {
    case "online":
      return "$connectionOnline";
    case "offline":
      return "$connectionOffline";
    default:
      return "$connectionChecking";
  }
});

/**
 * Colour for the connectivity icon. "checking" gets none on purpose: an
 * in-progress probe is not a result, so it inherits the app bar's own colour and
 * stays visually quiet.
 *
 * Offline is `warning`, not `error`: stored records are entirely unaffected by a
 * missing connection — only quotes and rates are — which is the same distinction
 * `mixed.smFetchDegraded.fetchDegradedMessage` already draws in words.
 */
const connectionColor = computed((): string | undefined => {
  switch (connectionState.value) {
    case "online":
      return "success";
    case "offline":
      return "warning";
    default:
      return undefined;
  }
});

/**
 * Accessible name and tooltip text for the indicator. Spelled out per state
 * with literal keys rather than an interpolated `t(\`…${state}\`)`, because
 * `scripts/i18n-lint.mjs` resolves keys statically and would report all three as
 * unused.
 */
const connectionLabel = computed((): string => {
  switch (connectionState.value) {
    case "online":
      return t("views.titleBar.connection.online");
    case "offline":
      return t("views.titleBar.connection.offline");
    default:
      return t("views.titleBar.connection.checking");
  }
});

/**
 * Account entries for the switcher, with a display label that degrades
 * gracefully. Using `cIban` directly as the item title rendered an empty,
 * unselectable-looking row for a blank IBAN — and blank is explicitly
 * reachable: `initializeRecords` normalizes a missing one to `""`, and the
 * import path strips blank IBANs entirely (stripBlankAccountIban).
 */
const accountItems = computed(() =>
    records.accounts.items.map((account) => ({
      ...account,
      mLabel: account.cIban?.trim() || account.cSwift?.trim() || `#${account.cID}`
    }))
);

/** Mapped balance value formatted as the currency string. */
const balance = computed((): string => {
  return n(records.bookings.sumBookings, "currency");
});
/** Mapped depot value formatted as the currency string. */
const depot = computed((): string => {
  return n(records.portfolio.sumDepot, "currency");
});

/**
 * Event handler for account selection changes.
 * Loads records for the newly selected account.
 */
const onUpdateTitleBar = async (): Promise<void> => {
  log("VIEWS TitleBar: onUpdateTitleBar");

  const seq = ++accountUpdateSeq;
  const selectedAccountId = settings.activeAccountId;

  // Suspends the `lastConfirmedAccountId` watcher for the duration of this
  // switch: `v-model` has already written the optimistic new id, and letting the
  // watcher adopt it as the revert target would make the revert a no-op.
  switchInFlight++;
  try {
    const storesDB = await databaseAdapter.getAccountRecords(selectedAccountId);
    if (seq !== accountUpdateSeq) return; // stale selection

    await records.init(storesDB, {
      title: t("mixed.smImportOnly.title"),
      message: t("mixed.smImportOnly.message")
    });

    if (seq !== accountUpdateSeq) return; // stale selection
    await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, selectedAccountId);
    lastConfirmedAccountId = selectedAccountId;
  } catch (err) {
    // v-model already applied the optimistic switch to settings.activeAccountId
    // before this handler ran. records.init() may have already succeeded and
    // re-hydrated the store with the newly-selected account's data even though a
    // later step (setStorage) then failed. Revert both settings AND records back
    // to the previously confirmed account, or a subsequent add (booking/stock)
    // would be persisted under the reverted account id while appearing spliced
    // into the other account's still-loaded in-memory list.
    if (seq === accountUpdateSeq) {
      settings.activeAccountId = lastConfirmedAccountId;
      try {
        const revertStoresDB = await databaseAdapter.getAccountRecords(lastConfirmedAccountId);
        if (seq === accountUpdateSeq) {
          await records.init(revertStoresDB, {
            title: t("mixed.smImportOnly.title"),
            message: t("mixed.smImportOnly.message")
          });
        }
      } catch (revertErr) {
        log("VIEWS TitleBar: failed to restore records after account-switch failure", revertErr, "error");
      }
    }
    await alertAdapter.feedbackError(t("views.titleBar.updateErrorTitle"), err, {});
  } finally {
    switchInFlight--;
  }
};

watch(
    [() => runtime.getCurrentView, () => runtime.isDownloading],
    () => {
      if (
          runtime.getCurrentView === "company" &&
          !runtime.isDownloading
      ) {
        if (depotTimer) clearTimeout(depotTimer);
        depotTimer = window.setTimeout(() => {
          showDepotChip.value = true;
        }, 180);
      } else {
        if (depotTimer) clearTimeout(depotTimer);
        showDepotChip.value = false; // hide instantly
      }
    },
    {immediate: true}
);

/**
 * Probes external connectivity and publishes the result.
 *
 * `probeSeq` is the same stale-response guard `onUpdateTitleBar` uses: a probe
 * that was superseded (by a reconnect, or by an authoritative `offline` event)
 * must not write its late answer over the newer one. Aborting the previous
 * controller makes that the common case rather than the race.
 */
const runConnectionProbe = async (): Promise<void> => {
  log("VIEWS TitleBar: runConnectionProbe");

  const seq = ++probeSeq;
  probeController?.abort();
  probeController = new AbortController();
  const {signal} = probeController;

  connectionState.value = "checking";
  try {
    const online = await fetchAdapter.fetchIsOk({signal});
    if (seq !== probeSeq) return;
    connectionState.value = online ? "online" : "offline";
  } catch (err) {
    void err;
    if (seq !== probeSeq) return;
    connectionState.value = "offline";
  }
};

/** The machine regained a network: the probe is worth re-running. */
const onBrowserOnline = (): void => {
  void runConnectionProbe();
};

/**
 * The machine lost its network. Authoritative — the browser fires this from the
 * OS network state — so it is published directly instead of spending the probe's
 * timeout confirming it. Bumping `probeSeq` first is what keeps an in-flight
 * probe from resolving afterwards and reporting "online" again.
 */
const onBrowserOffline = (): void => {
  probeSeq++;
  probeController?.abort();
  probeController = null;
  connectionState.value = "offline";
};

/**
 * Component initialization.
 * Performs a connectivity check to external services, and keeps it current: the
 * check used to run once at mount and never again, so a browser that restored
 * this tab before the network was up showed "no connection" for the rest of the
 * session — with no way to correct it short of a reload.
 */
onMounted(() => {
  window.addEventListener("online", onBrowserOnline);
  window.addEventListener("offline", onBrowserOffline);
  void runConnectionProbe();
});

onBeforeUnmount(() => {
  window.removeEventListener("online", onBrowserOnline);
  window.removeEventListener("offline", onBrowserOffline);
  probeController?.abort();
  if (depotTimer) clearTimeout(depotTimer);
});

log("VIEWS TitleBar: setup");
</script>

<template>
  <v-app-bar app color="secondary" flat>
    <template #prepend>
      <img
          :alt="t('views.titleBar.iconsAlt.logo')"
          :src="titleBarLogo"/>
    </template>
    <v-app-bar-title>{{ t("views.titleBar.title") }}</v-app-bar-title>
    <!--
      Unconditional, and outside the account switcher below. Connectivity is a
      property of the app, not of the selected account, and the switcher renders
      only once at least one account exists — which is exactly the empty state a
      first-time user sits in while wondering why nothing loads.

      The tooltip is the only thing that names the state in words; `aria-label`
      carries the same text for screen readers, since three similar network
      glyphs are not self-describing.
    -->
    <span :aria-label="connectionLabel" class="d-inline-flex align-center ms-2" role="img">
      <v-icon :color="connectionColor" :icon="connectionIcon"/>
      <v-tooltip :text="connectionLabel" activator="parent" location="bottom"/>
    </span>
    <v-spacer/>
    <v-chip
        v-if="!(runtime.getCurrentView === COMPANY)"
        class="text-h6"
        color="secondary"
        variant="flat"
    >{{ t("views.titleBar.bookingsSumLabel") }} : {{ balance }}
    </v-chip>
    <v-chip
        v-if="showDepotChip"
        class="text-h6"
        color="secondary"
        variant="flat"
    >{{ t("views.titleBar.depotSumLabel") }} : {{ depot }}
    </v-chip>
    <v-spacer/>
    <!--
      Gated on "are there accounts to choose from", NOT on "is one already
      chosen". The old `settings.activeAccountId > 0` hid the switcher precisely
      when it was needed: with accounts in the store but none active (reachable
      after a storage reset), this is the only control that can select one, so
      hiding it left the user's accounts unreachable — and a reload reproduced
      the same state rather than escaping it.
    -->
    <v-select
        v-if="records.accounts.items.length > 0"
        v-model="settings.activeAccountId"
        :disabled="runtime.getCurrentView === COMPANY"
        :item-title="'mLabel'"
        :item-value="INDEXED_DB.STORE.ACCOUNTS.FIELDS.ID"
        :items="accountItems"
        :label="t('views.titleBar.selectAccountLabel')"
        density="compact"
        hide-details
        max-width="350"
        variant="outlined"
        @update:model-value="onUpdateTitleBar">
      <template #prepend>
        <img :alt="t('views.titleBar.iconsAlt.logo')" :src="logoUrl"/>
      </template>
    </v-select>
  </v-app-bar>
</template>
