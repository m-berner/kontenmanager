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
import type {I_Header, I_Menu_Item} from '@/types'
import {useTheme} from 'vuetify'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useKeyboardShortcuts} from '@/composables/useKeyboardShortcuts'

const {d, n, t} = useI18n()
const {CONS, log, utcDate} = useApp()
const {closeDB} = useIndexedDB()
const {addStorageChangedListener, clearStorage, installStorageLocal} = useBrowser()
const records = useRecordsStore()
const {items: bookingItems} = storeToRefs(records.bookings)
const settings = useSettingsStore()
const {bookingsPerPage, skin} = storeToRefs(settings)
const {setBookingsPerPage} = settings

const theme = useTheme()

const T = Object.freeze<{ STRINGS: Record<string, string>, HEADERS: I_Header[], MENU_ITEMS: I_Menu_Item[] }>(
    {
        STRINGS: {
            ITEMS_PER_PAGE_TEXT: t('homeContent.bookingsTable.itemsPerPageText'),
            NO_DATA_TEXT: t('homeContent.bookingsTable.noDataText'),
            SEARCH_LABEL: t('homeContent.search')
        },
        HEADERS: [
            {
                title: t('homeContent.bookingsTable.headers.action'),
                align: 'start',
                sortable: false,
                key: 'mAction'
            },
            {
                title: t('homeContent.bookingsTable.headers.date'),
                align: 'start',
                sortable: false,
                key: 'cDate'
            },
            {
                title: t('homeContent.bookingsTable.headers.debit'),
                align: 'start',
                sortable: false,
                key: 'cDebit'
            },
            {
                title: t('homeContent.bookingsTable.headers.credit'),
                align: 'start',
                sortable: false,
                key: 'cCredit'
            },
            {
                title: t('homeContent.bookingsTable.headers.description'),
                align: 'start',
                sortable: false,
                key: 'cDescription'
            },
            {
                title: t('homeContent.bookingsTable.headers.bookingType'),
                align: 'start',
                sortable: false,
                key: 'cBookingType'
            }
        ],
        MENU_ITEMS: [
            {
                id: 'delete-booking',
                title: t('homeContent.bookingsTable.menuItems.delete'),
                icon: '$deleteBooking',
                action: 'deleteBooking'
            },
            {
                id: 'update-booking',
                title: t('homeContent.bookingsTable.menuItems.update'),
                icon: '$updateBooking',
                action: 'updateBooking',
                variant: 'danger'
            }
        ]
    }
)

const search = ref<string>('')

const changeHandler = (changes: Record<string, browser.storage.StorageChange>): void => {
    log('APP_INDEX: changeHandler')
    const changesKey = Object.keys(changes)
    const {service, indexes, markets, materials, exchanges} = storeToRefs(settings)
    switch (changesKey[0]) {
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN:
            if (theme?.global?.name) {
                theme.global.name.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN].newValue
            }
            skin.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN].newValue
            break
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE:
            service.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE].newValue
            break
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES:
            indexes.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES].newValue
            break
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS:
            markets.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS].newValue
            break
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS:
            materials.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS].newValue
            break
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES:
            exchanges.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES].newValue
            break
        default:
    }
}
const removeStorageChangedListener = addStorageChangedListener(changeHandler)
// TODO ad exchange immediate update not working
// TODO Tradegate fetch not working
// TODO edit company, add company not working
// TODO edit, add booking
const {shortcuts} = useKeyboardShortcuts()
const resetStorage = async (): Promise<void> => {
    await clearStorage()
    await installStorageLocal()
}
const toggleDebug = () => {
    const debugValue = localStorage.getItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG)
    if (debugValue !== '1') {
        localStorage.setItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG, '1')
    } else {
        localStorage.setItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG, '0')
    }
}
shortcuts.value.set('Alt+Control+d', toggleDebug)
shortcuts.value.set('Alt+Control+r', resetStorage)

const onBeforeUnload = (): void => {
    log('APP_INDEX: onBeforeUnload')
    removeStorageChangedListener()
    closeDB()
}
window.addEventListener('beforeunload', onBeforeUnload, CONS.SYSTEM.ONCE)

log('--- HomeContent.vue setup ---')
</script>

<template>
    <v-text-field
        v-model="search"
        :label="T.STRINGS.SEARCH_LABEL"
        density="compact"
        hide-details
        prepend-inner-icon="$magnify"
        single-line
        variant="outlined"/>
    <v-data-table
        :headers="T.HEADERS"
        :hide-no-data="false"
        :hover="true"
        :items="bookingItems"
        :items-per-page="bookingsPerPage"
        :items-per-page-options="CONS.SETTINGS.ITEMS_PER_PAGE_OPTIONS"
        :items-per-page-text="T.STRINGS.ITEMS_PER_PAGE_TEXT"
        :no-data-text="T.STRINGS.NO_DATA_TEXT"
        :search="search"
        density="compact"
        item-key="cID"
        @update:items-per-page="setBookingsPerPage">
        <template v-slot:[`item`]="{ item }">
            <tr class="table-row">
                <td class="d-none">{{ item.cID }}</td>
                <td>
                    <DotMenu
                        :items="T.MENU_ITEMS"
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
