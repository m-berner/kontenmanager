<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed, onBeforeUnmount, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

import {COMPONENTS, CURRENCIES} from "@/domain/constants";
import type {AccountFormProps} from "@/domain/types";
import {log} from "@/domain/utils/utils";
import {createIbanMessages, createSwiftMessages} from "@/domain/validation/messages";

import {useAdapters} from "@/adapters/context";
import {useFavicon} from "@/adapters/ui/composables/useFavicon";
import {useAccountForm} from "@/adapters/ui/composables/useForms";
import {useUrl} from "@/adapters/ui/composables/useUrl";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";

const props = defineProps<AccountFormProps>();

const {t} = useI18n();
const {accountFormData} = useAccountForm();
const {validationAdapter} = useAdapters();
const records = useRecordsStore();

const SWIFT_RULES = createSwiftMessages(t);
const IBAN_RULES = createIbanMessages(t);
// Plain ISO codes, untranslated — the same reasoning `createServiceLabelOverrides`
// applies to provider brand names. "EUR" and "USD" are ISO 4217 identifiers, not
// words, and are written the same way in both shipped locales.
// Widened to `string[]` deliberately: `CURRENCIES.SUPPORTED` is `as const`, so a
// bare spread gives `("EUR"|"USD")[]`, from which Vuetify infers the v-model as
// that union — and `accountFormData.currency` is a plain `string`, since
// `validateAccount` is what actually constrains it at the boundary.
const CURRENCY_ITEMS: string[] = [...CURRENCIES.SUPPORTED];

const search = ref<string>("");

const groupedLabel = (clean: string): string =>
    clean.length > 1 ? ` / ${clean.replace(/(.{4})/g, "$1 ")}` : "";

// UpdateAccount.vue's onBeforeMount (parent) populates accountFormData
// before this component's setup() runs (child). So derive the initial
// label from whatever value is already there instead of hardcoding "" -
// otherwise editing an existing account shows a blank label suffix until
// the user retypes the field.
const swiftLabel = ref<string>(groupedLabel(accountFormData.swift));
const ibanLabel = ref<string>(groupedLabel(accountFormData.iban));

/**
 * Validation rules for the IBAN field — **none on the update path.**
 *
 * The field is `:disabled` there because an IBAN is the account's identity
 * (`accounts_uk1`) and is deliberately immutable once created. A field the user
 * cannot change must not gate the form, and binding rules to it did exactly
 * that: Vuetify runs a *disabled* input's rules anyway. `useValidation`
 * registers with the form unconditionally in `onBeforeMount`, its `validate()`
 * has no disabled short-circuit, and the `isDisabled` it exposes is the
 * enclosing **form's** prop rather than the input's own — so
 * `createForm.validate()`, which iterates every registered item without
 * filtering, collected this field's failures like any other.
 *
 * The consequence was not cosmetic. `submitGuard` is fail-closed: an invalid
 * form returns early with the generic `xx_form_invalid` toast and never runs
 * `operation`. So for any account whose stored IBAN is blank or
 * checksum-invalid, *Update account* could never be saved — currency, SWIFT,
 * the depot flag and the logo were all permanently uneditable, and the field
 * responsible was greyed out, so nothing on screen explained why.
 *
 * Both states are ordinary rather than corrupt, which is what made this
 * reachable:
 * - `AccountDb.cIban` is optional **by design** — `accounts_uk1` is a global
 *   unique index and IndexedDB indexes `""` as a colliding value, so
 *   `accountRepository.save()` and `stripBlankAccountIban()` omit a blank one
 *   and `initializeRecords` normalizes it back to `""` on the way in.
 * - `validateAccount()` only *logs a warning* for a failed checksum and stores
 *   the record regardless, so an imported IBAN that fails MOD-97 persists.
 * - `TitleBar`'s `mLabel` fallback (`cSwift` → `#${cID}`) exists precisely so
 *   IBAN-less accounts stay visible and selectable in the switcher.
 *
 * On the add path the rules are unchanged. `excludeId` is dropped along with
 * them: it only ever had a value when `isUpdate` was true, which is now the
 * branch that has no duplicate rule to exclude anything from.
 */
const ibanRules = computed(() =>
    props.isUpdate
        ? []
        : validationAdapter.ibanRules(IBAN_RULES, (iban) => records.accounts.isDuplicate(iban))
);

const {domain} = useUrl(search);
const {faviconUrl, onLoad, onError, reset} = useFavicon(domain);

watch(domain, () => reset());

const onUpdateSwift = (swift: string): void => {
  if (!swift) {
    swiftLabel.value = "";
    accountFormData.swift = "";
    return;
  }

  const clean = swift.replace(/\s/g, "").toUpperCase();
  accountFormData.swift = clean;
  swiftLabel.value = groupedLabel(clean);
};

const onUpdateIban = (iban: string): void => {
  if (!iban) {
    ibanLabel.value = "";
    accountFormData.iban = "";
    return;
  }

  const clean = iban.replace(/\s/g, "").toUpperCase();
  accountFormData.iban = clean;
  ibanLabel.value = groupedLabel(clean);
};

let timeoutId: ReturnType<typeof setTimeout>;
watch(faviconUrl, (newUrl) => {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    if (newUrl) {
      accountFormData.logoUrl = newUrl;
    }
  }, 400);
});

onBeforeUnmount(() => {
  if (timeoutId) clearTimeout(timeoutId);
});

log("COMPONENTS DIALOGS FORMS AccountForm: setup");
</script>

<template>
  <v-switch
      v-model="accountFormData.withDepot"
      :label="t('components.dialogs.forms.accountForm.withDepotLabel')"
      color="red"
      variant="outlined"/>
  <!--
    The currency this account's bookings are in, and the one its quotes are
    converted into. Editable on update as well as on add: it is a correction of
    what the stored amounts always were, not a conversion — nothing rewrites the
    numbers, so changing it on an account with real bookings relabels them.
    That is the honest behaviour for a field that records a fact about existing
    data, but it is why the hint spells it out.
  -->
  <v-select
      class="currency-select"
      v-model="accountFormData.currency"
      :hint="t('components.dialogs.forms.accountForm.currencyHint')"
      :items="CURRENCY_ITEMS"
      :label="t('components.dialogs.forms.accountForm.currencyLabel')"
      density="compact"
      persistent-hint
      variant="outlined"/>
  <v-text-field
      v-model="accountFormData.swift"
      :counter="11"
      :label="`${t('components.dialogs.forms.accountForm.swiftLabel')}${swiftLabel}`"
      :rules="validationAdapter.swiftRules(SWIFT_RULES)"
      autofocus
      variant="outlined"
      @update:model-value="onUpdateSwift"/>
  <v-text-field
      v-model="accountFormData.iban"
      :disabled="props.isUpdate"
      :label="`${t('components.dialogs.forms.accountForm.ibanLabel')}${ibanLabel}`"
      :placeholder="t('components.dialogs.forms.accountForm.ibanPlaceholder')"
      :rules="ibanRules"
      variant="outlined"
      @update:model-value="onUpdateIban"/>
  <v-text-field
      v-model="search"
      :label="t('components.dialogs.forms.accountForm.searchLabel')"
      :placeholder="COMPONENTS.DIALOGS.PLACEHOLDER.ACCOUNT_LOGO_URL"
      variant="outlined"/>
  <!-- Logo Preview -->
  <div class="mb-4">
    <v-avatar class="me-3" color="white" size="48">
      <v-img
          :alt="t('components.dialogs.forms.accountForm.missingLogo')"
          :src="accountFormData.logoUrl"
          @error="onError"
          @load="onLoad"/>
    </v-avatar>
  </div>
</template>

<style scoped>
.currency-select {
  margin-bottom: 24px;
}
</style>