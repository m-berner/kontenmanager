<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeUnmount, ref, watch} from "vue";
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
      :rules="validationAdapter.ibanRules(IBAN_RULES, (iban) => records.accounts.isDuplicate(iban, props.isUpdate ? accountFormData.id : undefined))"
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