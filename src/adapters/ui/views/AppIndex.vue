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

// Invalidate online-rate caches when provider settings change (single instance for the app lifetime).
watch(() => settings.service, () => {
  runtime.clearStocksPages();
  fetchAdapter.clearCache?.();
});
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
 * Not `{once: true}`: `pagehide` can fire for a page entering the back/forward
 * cache and then be revisited, and a one-shot listener would silently not be
 * there the second time.
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
