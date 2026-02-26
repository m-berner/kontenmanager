<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeUnmount, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useFavicon} from "@/composables/useFavicon";
import {useDomain} from "@/composables/useDomain";
import {useAccountForm} from "@/composables/useForms";
import {COMPONENTS} from "@/configs/components";
import type {AccountFormProps} from "@/types";
import {validationService} from "@/services/validation";
import {
  createIbanMessages,
  createSwiftMessages
} from "@/domains/validation/messages";
import {DomainUtils} from "@/domains/utils";

const props = defineProps<AccountFormProps>();

const {t} = useI18n();
const {accountFormData} = useAccountForm();
//const { handleUserInfo } = useAlert();

const SWIFT_RULES = createSwiftMessages(t);
const IBAN_RULES = createIbanMessages(t);

const search = ref<string>("");
const swiftLabel = ref<string>("");
const ibanLabel = ref<string>("");

const onUpdateSwift = (swift: string): void => {
  if (!swift) {
    swiftLabel.value = "";
    accountFormData.swift = "";
    return;
  }

  const clean = swift.replace(/\s/g, "").toUpperCase();
  accountFormData.swift = clean;
  swiftLabel.value =
      accountFormData.swift.length > 1
          ? ` / ${clean.replace(/(.{4})/g, "$1 ")}`
          : "";
};

const onUpdateIban = (iban: string): void => {
  if (!iban) {
    ibanLabel.value = "";
    accountFormData.iban = "";
    return;
  }

  const clean = iban.replace(/\s/g, "").toUpperCase();
  accountFormData.iban = clean;
  ibanLabel.value =
      accountFormData.iban.length > 1
          ? ` / ${clean.replace(/(.{4})/g, "$1 ")}`
          : "";
};

const {domain} = useDomain(search);

const {faviconUrl} = useFavicon(domain);

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

DomainUtils.log("COMPONENTS DIALOGS FORMS AccountForm: setup");
</script>

<template>
  <v-switch
      v-model="accountFormData.withDepot"
      :label="t('components.dialogs.forms.accountForm.withDepotLabel')"
      color="red"
      variant="outlined"/>
  <v-text-field
      v-model="accountFormData.swift"
      :counter="11"
      :label="`${t(
      'components.dialogs.forms.accountForm.swiftLabel'
    )}${swiftLabel}`"
      :rules="validationService.swiftRules(SWIFT_RULES)"
      autofocus
      variant="outlined"
      @update:model-value="onUpdateSwift"/>
  <v-text-field
      v-model="accountFormData.iban"
      :disabled="props.isUpdate"
      :label="`${t(
      'components.dialogs.forms.accountForm.ibanLabel'
    )}${ibanLabel}`"
      :placeholder="t('components.dialogs.forms.accountForm.ibanPlaceholder')"
      :rules="validationService.ibanRules(IBAN_RULES)"
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
          :src="accountFormData.logoUrl"/>
    </v-avatar>
  </div>
</template>
