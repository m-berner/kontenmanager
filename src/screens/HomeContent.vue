<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {ref} from 'vue'
import {storeToRefs} from 'pinia'
import {useI18n} from 'vue-i18n'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {useApp} from '@/composables/useApp'
import DotMenu from '@/components/DotMenu.vue'
import {useTheme} from 'vuetify'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useKeyboardShortcuts} from '@/composables/useKeyboardShortcuts'
import {useAppConfig} from '@/composables/useAppConfig'
import type {I_Header, I_Menu_Item} from '@/types'

const {d, n, t} = useI18n()
const {log, utcDate} = useApp()
const {BROWSER_STORAGE, LOCAL_STORAGE, SETTINGS, SYSTEM} = useAppConfig()
const {closeDB} = useIndexedDB()
const {addStorageChangedListener, clearStorage, installStorageLocal} = useBrowser()
const records = useRecordsStore()
const {items: bookingItems} = storeToRefs(records.bookings)
const settings = useSettingsStore()
const {bookingsPerPage, skin} = storeToRefs(settings)
const {setBookingsPerPage} = settings
const theme = useTheme()

const HEADERS: I_Header[] = [
    {
        title: t('screens.homeContent.bookingsTable.headers.action'),
        align: 'start',
        sortable: false,
        key: 'mAction'
    },
    {
        title: t('screens.homeContent.bookingsTable.headers.date'),
        align: 'start',
        sortable: false,
        key: 'cDate'
    },
    {
        title: t('screens.homeContent.bookingsTable.headers.debit'),
        align: 'start',
        sortable: false,
        key: 'cDebit'
    },
    {
        title: t('screens.homeContent.bookingsTable.headers.credit'),
        align: 'start',
        sortable: false,
        key: 'cCredit'
    },
    {
        title: t('screens.homeContent.bookingsTable.headers.description'),
        align: 'start',
        sortable: false,
        key: 'cDescription'
    },
    {
        title: t('screens.homeContent.bookingsTable.headers.bookingType'),
        align: 'start',
        sortable: false,
        key: 'cBookingType'
    }
]
const MENU_ITEMS: I_Menu_Item[] = [
    {
        id: 'delete-booking',
        title: t('screens.homeContent.bookingsTable.menuItems.delete'),
        icon: '$deleteBooking',
        action: 'deleteBooking'
    },
    {
        id: 'update-booking',
        title: t('screens.homeContent.bookingsTable.menuItems.update'),
        icon: '$updateBooking',
        action: 'updateBooking',
        variant: 'danger'
    }
]

const search = ref<string>('')

const onChangeHandler = (changes: Record<string, browser.storage.StorageChange>): void => {
    log('APP_INDEX: changeHandler')
    const changesKey = Object.keys(changes)
    const {service, indexes, markets, materials, exchanges} = storeToRefs(settings)
    switch (changesKey[0]) {
        case BROWSER_STORAGE.LOCAL.SKIN.key:
            if (theme?.global?.name) {
                theme.global.name.value = changes[BROWSER_STORAGE.LOCAL.SKIN.key].newValue
            }
            skin.value = changes[BROWSER_STORAGE.LOCAL.SKIN.key].newValue
            break
        case BROWSER_STORAGE.LOCAL.SERVICE.key:
            service.value = changes[BROWSER_STORAGE.LOCAL.SERVICE.key].newValue
            break
        case BROWSER_STORAGE.LOCAL.INDEXES.key:
            indexes.value = changes[BROWSER_STORAGE.LOCAL.INDEXES.key].newValue
            break
        case BROWSER_STORAGE.LOCAL.MARKETS.key:
            markets.value = changes[BROWSER_STORAGE.LOCAL.MARKETS.key].newValue
            break
        case BROWSER_STORAGE.LOCAL.MATERIALS.key:
            materials.value = changes[BROWSER_STORAGE.LOCAL.MATERIALS.key].newValue
            break
        case BROWSER_STORAGE.LOCAL.EXCHANGES.key:
            exchanges.value = changes[BROWSER_STORAGE.LOCAL.EXCHANGES.key].newValue
            break
        default:
    }
}
const removeStorageChangedListener = addStorageChangedListener(onChangeHandler)
const {shortcuts} = useKeyboardShortcuts()
const onResetStorage = async (): Promise<void> => {
    await clearStorage()
    await installStorageLocal()
}
const onToggleDebug = () => {
    const debugValue = localStorage.getItem(LOCAL_STORAGE.PROPS.DEBUG)
    if (debugValue !== '1') {
        localStorage.setItem(LOCAL_STORAGE.PROPS.DEBUG, '1')
    } else {
        localStorage.setItem(LOCAL_STORAGE.PROPS.DEBUG, '0')
    }
}
shortcuts.value.set('Alt+Control+d', onToggleDebug)
shortcuts.value.set('Alt+Control+r', onResetStorage)
const onBeforeUnload = (): void => {
    log('APP_INDEX: onBeforeUnload')
    removeStorageChangedListener()
    closeDB()
}
window.addEventListener('beforeunload', onBeforeUnload, SYSTEM.ONCE)

log('--- HomeContent.vue setup ---')
</script>

<template>
    <v-text-field
        v-model="search"
        :label="t('screens.homeContent.search')"
        density="compact"
        hide-details
        prepend-inner-icon="$magnify"
        single-line
        variant="outlined"/>
    <v-data-table
        :headers="HEADERS"
        :hide-no-data="false"
        :hover="true"
        :items="bookingItems"
        :items-per-page="bookingsPerPage"
        :items-per-page-options="SETTINGS.ITEMS_PER_PAGE_OPTIONS"
        :items-per-page-text="t('screens.homeContent.bookingsTable.itemsPerPageText')"
        :no-data-text="t('screens.homeContent.bookingsTable.noDataText')"
        :search="search"
        density="compact"
        item-key="cID"
        @update:items-per-page="setBookingsPerPage">
        <template v-slot:[`item`]="{ item }">
            <tr class="table-row">
                <td class="d-none">{{ item.cID }}</td>
                <td>
                    <DotMenu
                        :items="MENU_ITEMS"
                        :record-id="item.cID!"/>
                </td>
                <td>{{ d(utcDate(item.cBookDate), 'short') }}</td>
                <td>{{ n(item.cDebit, 'currency') }}</td>
                <td>{{ n(item.cCredit, 'currency') }}</td>
                <td>{{ item.cDescription }}</td>
                <td>{{ records.bookingTypes.getNameById(item.cBookingTypeID) }}</td>
                <td class="d-none">{{ item.cAccountNumberID }}</td>
            </tr>
        </template>
    </v-data-table>
</template>
