<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview AppIndex is the application shell for the popup/app context.
 * It orchestrates startup initialization, theme application, and renders the
 * named view outlets (title, header, info, default, footer). Displays a
 * loading indicator until initialization completes.
 */

import {computed, onBeforeMount, onUnmounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {RouterView} from "vue-router";

import {resolveDisplayCurrency} from "@/domain/logic";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import AlertOverlay from "@/adapters/ui/components/AlertOverlay.vue";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const settings = useSettingsStore();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const {alertAdapter, appAdapter, databaseAdapter, fetchAdapter} = useAdapters();

// The single owner of quote-cache invalidation, for the app's lifetime.
//
// All three triggers live here rather than on the route components that consume
// the cache, because this shell is always mounted: a watcher on `CompanyContent`
// only exists while that route is. `CompanyContent` used to duplicate the
// `stocksPerPage` one exactly — same value, same idempotent call — which cost
// nothing but left two places to keep in step.
//
// `stocksPerPage`: changing the page size moves every page boundary, so the
// per-page freshness markers no longer describe anything real. Invalidation only
// — the refetch is deliberately left to `CompanyContent.onCurrentItems`, which
// fires because the rendered row set changed and knows exactly which rows those
// are. See the note at that end for the race that made this the rule.
//
// `service`'s own FX-refresh half is registered further down, alongside
// `refreshRates` and the `displayCurrency` watcher it shares an abort
// controller with — see the comment there for why a provider change needs
// more than cache invalidation.
watch(() => settings.activeAccountId, () => runtime.clearStocksPages());
watch(() => settings.stocksPerPage, () => runtime.clearStocksPages());

const isInitialized = ref(false);
// Both critical startup phases (storage, database) throw by design, so a
// transient IndexedDB or storage failure used to leave isInitialized false
// forever: one error toast over an indeterminate spinner, with no retry and no
// way forward but a manual reload. Track the failure explicitly and offer a
// retry instead.
const hasInitError = ref(false);
const isRetrying = ref(false);
// Which non-critical startup phases are unavailable. `initializeApp` returns a
// structured per-phase AppStatus — `storage` and `db` each
// "ok" | "error" | "aborted", plus three `fetch` booleans — and this component
// used to log it and then set `isInitialized` unconditionally, with the log line
// reading "Initialization successful" whatever the status contained. Nothing
// inspected a single field.
//
// Read together with `getStatus` — which had no callers at all — the whole status
// mechanism was write-only: the AppStatus type, `createDefaultStatus`,
// `handleAbort`, `executePhase`'s status-key plumbing and the
// `lastStatusSnapshot` cache all existed to produce a value nothing read. A
// degraded banner is exactly the affordance the `fetch` half supports — the app
// is usable without market data, so blocking would be wrong, but saying nothing
// leaves the user to wonder why every quote is blank.
//
// Derived through `getStatus` rather than from `initializeApp`'s return value,
// which is what gives that accessor its consumer. The difference is not
// cosmetic: `getStatus` derives live, so the banner *clears itself* when data
// arrives later (the three `runtime.info*` maps are reactive), where a
// boot-time snapshot would have stayed on screen for the session. Note
// `databaseAdapter.isConnected()` is not reactive, so a later disconnect is
// picked up only when some other dependency re-triggers this computed — stated
// rather than overclaimed.
const degradedFetch = computed((): string[] => {
  if (!isInitialized.value) return [];
  const status = appAdapter.getStatus({records, settings, runtime});
  return Object.entries(status.fetch)
      .filter(([, ok]) => !ok)
      .map(([name]) => name);
});
// Explicit dismissal state, because `degradedFetch` is a computed. Vuetify's
// bare `closable` manages its own internal visibility, which a `v-if` bound to a
// recomputing source would silently override — the banner would come back on the
// next re-render. Reset on each initialization attempt so a retry can surface it
// again.
const degradedDismissed = ref(false);
let controller: AbortController | null = null;

/**
 * The currency every figure on screen is denominated in.
 *
 * The SAME expression `currencySync` watches to patch the number formats, and
 * deliberately so: that plugin decides the currency *symbol*, the watcher below
 * decides the currency a quote is *converted into*, and those two drifting apart
 * is exactly the failure `resolveDisplayCurrency`'s doc comment describes.
 */
const displayCurrency = computed(() => resolveDisplayCurrency(
    records.accounts.items,
    settings.activeAccountId,
    settings.currency
));

let ratesController: AbortController | null = null;

/**
 * Re-fetches the FX rates and, once they land (or the fetch was skipped
 * outright), invalidates the quote cache so the next render picks them up.
 *
 * Shared by the `displayCurrency` and `settings.service` watchers below, one
 * abort controller for both: whichever of the two fires most recently wins,
 * and an in-flight fetch a newer trigger supersedes is simply discarded
 * rather than racing its write-back against the newer one's.
 *
 * `clearStocksPages()` runs AFTER the await, not before. It is what makes the
 * next render re-fetch, and a fetch kicked off before the new rates land would
 * convert with the very divisors this is replacing. It is also what supersedes
 * anything already in flight: it bumps every page's generation, so an in-flight
 * `loadOnlineData` discards its write-back rather than committing a
 * wrongly-converted quote.
 */
async function refreshRates(): Promise<void> {
  ratesController?.abort();
  const rates = new AbortController();
  ratesController = rates;

  try {
    await appAdapter.refreshExchangeRates(
        {records, settings, runtime},
        rates.signal
    );
  } catch (err) {
    // Non-critical, exactly like Phase 3 at boot: the app is fully usable with
    // stale-or-absent rates, and `resolveBaseExchangePairs` has already reset
    // both divisors to 1, so nothing converts with the previous currency's rate.
    log("VIEWS AppIndex: refreshing exchange rates failed", err, "warn");
  } finally {
    if (ratesController === rates) ratesController = null;
  }

  if (rates.signal.aborted) return;
  runtime.clearStocksPages();
}

/**
 * Re-fetches the FX rates whenever the display currency changes.
 *
 * `runtime.curUsd`/`curEur` are the divisors every quote is converted by, and
 * they used to be written only by `initializeApp`'s Phase 3 — once, at mount —
 * from whichever currency was active *then*. Switching to an account with the
 * other `cCurrency` therefore left one divisor holding a stale rate and the
 * other the `1` seeded for the *previous* currency's self-pair, and
 * `useOnlineStockData` converted every quote with it: a EUR-quoted stock showed
 * its EUR price verbatim as USD (or the mirror image), silently, propagating
 * into `mChange`, the depot total and the app-bar chip — while `currencySync`
 * had already relabelled everything with the new symbol.
 *
 * Watches the resolved value rather than any one input, so it covers all three
 * ways the display currency can change: switching accounts, editing the active
 * account's `cCurrency`, and changing `settings.currency` while no account is
 * active.
 */
watch(displayCurrency, async () => {
  // Boot owns the first fetch. `initializeApp`'s Phase 2 loads the accounts,
  // which is itself a change to `displayCurrency` (it starts at the storage
  // default with no accounts loaded), so without this gate a USD-account user
  // got a second, redundant FX fetch queued while Phase 3 — which already reads
  // the resolved currency, since it runs after Phase 2 — was still in flight.
  // Both write the same values, so this is about not doing the work twice and
  // not interleaving two writers, not about correctness.
  if (!isInitialized.value) return;
  await refreshRates();
});

/**
 * Re-fetches FX rates too when the quote provider changes, not just the
 * quote cache — and always clears the cache/cache-invalidation markers
 * either way.
 *
 * `runtime.curUsd`/`curEur` have exactly two writers: boot Phase 3 and the
 * `displayCurrency` watcher above, and BOTH skip entirely when
 * `settings.service === "none"` (`appAdapter.ts`'s `fetchExternalData`/
 * `refreshExchangeRates`). `"none"` is a first-class, user-selectable
 * provider (`ServiceSelector` lists it, translated as "service disabled"),
 * reachable live from the options page while the app tab stays open. A user
 * who starts on `none` and later picks a real provider therefore got quotes
 * — this watcher already invalidated the cache, so `CompanyContent` re-fetched
 * — but no divisors to convert a non-target-currency quote by: it rendered
 * unconverted, silently, under the correct-looking currency symbol, until a
 * full reload (which runs Phase 3 fresh).
 *
 * Only calls `refreshRates` once initialized, matching the `displayCurrency`
 * watcher's own guard: `settings.service` is assigned during boot's
 * `settings.load()`, which fires this watcher before Phase 3 has run, and
 * `refreshRates` would otherwise race Phase 3's own fetch.
 */
watch(() => settings.service, async () => {
  fetchAdapter.clearCache?.();
  if (isInitialized.value) {
    await refreshRates();
  } else {
    runtime.clearStocksPages();
  }
});

const runInitialization = async (): Promise<void> => {
  hasInitError.value = false;
  degradedDismissed.value = false;

  try {
    controller = new AbortController();
    const status = await appAdapter.initializeApp(
        {records, settings, runtime},
        {
          title: t("mixed.smImportOnly.title"),
          message: t("mixed.smImportOnly.message")
        },
        controller.signal
    );

    // The abort branch below cannot fire, and this is why: `initializeApp` does
    // not *throw* on abort — it returns `handleAbort(status)`, and its phase
    // functions return early rather than raising. So an aborted startup used to
    // take the success path and render the full app shell over stores that were
    // never hydrated. In practice the only abort trigger is `onUnmounted`, so
    // the component is going away anyway, which is why this was never seen —
    // but the guard's existence advertised a contract nothing enforced.
    if (status.storage === "aborted" || status.db === "aborted") {
      log("VIEWS AppIndex: Initialization aborted", status, "info");
      return;
    }

    if (status.storage === "error" || status.db === "error") {
      log("VIEWS AppIndex: Initialization failed", status, "error");
      hasInitError.value = true;
      return;
    }

    log(
        "VIEWS AppIndex: Initialization successful",
        status,
        "info"
    );

    isInitialized.value = true;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      log("VIEWS AppIndex: Initialization aborted");
      return;
    }
    hasInitError.value = true;
    await alertAdapter.feedbackError(t("views.appIndex.init"), err, {});
  }
};

const onRetryInit = async (): Promise<void> => {
  if (isRetrying.value) return;
  isRetrying.value = true;
  try {
    await runInitialization();
  } finally {
    isRetrying.value = false;
  }
};

/**
 * Closes the IndexedDB connection when the page goes away.
 *
 * Lives here, on the app shell, rather than on a route component. It used to be
 * registered by `HomeContent.onBeforeMount` and torn down by its `onUnmounted`,
 * so it existed only while the Home route was mounted: closing the tab from
 * /company, /help or /privacy disconnected nothing. The connection belongs to
 * the page, not to a route, and `connectionManager.disconnect()` was hardened
 * specifically for this caller (it awaits an in-flight `connect()` first, "which
 * is exactly when a slow connect could still be in flight").
 *
 * Registered on `beforeunload`, not `pagehide`, even though `pagehide` is the
 * more reliable teardown signal in general and `browserAdapter.writeBufferToFile`
 * uses it for its own blob-URL cleanup. The difference that matters here is that
 * `pagehide` ALSO fires when a page enters the back/forward cache — and that page
 * can be revisited. Disconnecting there would leave a restored, still-mounted app
 * with a closed IndexedDB connection and no path back to one short of a reload:
 * `connectionManager.connect()` is called only from `appAdapter`'s boot phase, and
 * every dialog's `submitGuard` is gated on `databaseAdapter.isConnected()`.
 * `beforeunload` fires only for a real teardown, which is the event this wants.
 *
 * (This comment previously argued the `pagehide` case while the listener below
 * was already `beforeunload` — the reasoning described an event the code does not
 * use.)
 *
 * Not `{once: true}`: `beforeunload` can fire more than once for one document
 * when a navigation is started and then cancelled, and a one-shot listener would
 * silently not be there the second time.
 */
const onBeforeUnload = (): void => {
  log("VIEWS AppIndex: onBeforeUnload");
  void databaseAdapter.disconnect();
};

onBeforeMount(async () => {
  log("VIEWS AppIndex: onBeforeMount");
  window.addEventListener("beforeunload", onBeforeUnload);
  await runInitialization();
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  if (controller) {
    controller.abort();
  }
  ratesController?.abort();
});

log("VIEWS AppIndex: setup", window.location.href, "info");
</script>

<template>
  <v-app :flat="true">
    <template v-if="isInitialized">
      <!--
        Non-critical: the app works without market data, so this informs rather
        than blocks. Closable, because a user who has read it once should not
        keep being told for the rest of the session.
      -->
      <v-alert
          v-if="degradedFetch.length > 0 && !degradedDismissed"
          :text="t('views.appIndex.fetchDegradedMessage')"
          :title="t('views.appIndex.fetchDegraded')"
          closable
          density="compact"
          type="warning"
          variant="tonal"
          @click:close="degradedDismissed = true"/>
      <RouterView name="title"/>
      <RouterView name="header"/>
      <RouterView name="info"/>
      <v-main>
        <RouterView/>
      </v-main>
      <RouterView name="footer"/>
    </template>
    <template v-else-if="hasInitError">
      <v-main>
        <v-container
            class="d-flex align-center justify-center"
            style="min-height: 100vh">
          <v-alert
              :title="t('views.appIndex.init')"
              class="mx-auto"
              max-width="500"
              type="error"
              variant="tonal">
            <p class="mb-4">{{ t("views.appIndex.initFailedMessage") }}</p>
            <v-btn
                :loading="isRetrying"
                color="error"
                variant="elevated"
                @click="onRetryInit">
              {{ t("views.appIndex.retry") }}
            </v-btn>
          </v-alert>
        </v-container>
      </v-main>
    </template>
    <template v-else>
      <v-main>
        <v-container
            class="d-flex align-center justify-center"
            style="min-height: 100vh">
          <v-progress-circular color="primary" indeterminate size="64"/>
        </v-container>
      </v-main>
    </template>
    <AlertOverlay/>
  </v-app>
</template>
