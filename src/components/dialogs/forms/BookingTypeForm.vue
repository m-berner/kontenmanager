<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useBookingTypeForm } from "@/composables/useForms";
import { ValidationService } from "@/services/validation";
import { INDEXED_DB } from "@/config/database";
import type { BookingTypeFormProps } from "@/types";
import { UtilsService } from "@/domains/utils";

const props = defineProps<BookingTypeFormProps>();

const { t } = useI18n();
const records = useRecordsStore();
const { bookingTypeFormData } = useBookingTypeForm();

const NAME_RULES = [
  t("validators.nameRules.required"),
  t("validators.nameRules.length"),
  t("validators.nameRules.begin")
];

const edit = ref(false);
const nameInput = ref<HTMLElement | null>(null);

const onSelect = (id: number | null) => {
  if (!id) return;
  const item = records.bookingTypes.getById(id);
  if (item) {
    edit.value = true;
    bookingTypeFormData.id = item.cID;
    bookingTypeFormData.name = item.cName;
    nextTick(() => {
      nameInput.value?.focus();
    });
  }
};

const onClear = (): void => {
  edit.value = false;
};

UtilsService.log("--- components/dialogs/forms/BookingTypeForm.vue setup ---");
</script>

<template>
  <v-select
    v-if="props.mode !== 'add'"
    v-model="bookingTypeFormData.id"
    :item-title="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME"
    :item-value="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID"
    :items="records.bookingTypes.items"
    :label="t('components.dialogs.updateBookingType.bookingTypeLabel')"
    :menu-props="{ maxHeight: '200px' }"
    class="mb-4"
    clearable
    density="compact"
    variant="outlined"
    @click:clear="onClear"
    @update:model-value="onSelect"
  />

  <v-text-field
    v-if="(edit && props.mode !== 'delete') || props.mode === 'add'"
    ref="nameInput"
    v-model="bookingTypeFormData.name"
    :autofocus="props.mode === 'add'"
    :counter="32"
    :label="t(`components.dialogs.${props.mode}BookingType.title`)"
    :placeholder="t('components.dialogs.addBookingType.placeholder')"
    :rules="ValidationService.nameRules(NAME_RULES)"
    density="compact"
    variant="outlined"
  />
</template>
