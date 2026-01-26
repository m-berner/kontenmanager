<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {RouterLink} from 'vue-router'
import {storeToRefs} from 'pinia'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useAlertStore} from '@/stores/alerts'
import {UtilsService} from '@/domains/utils'
import {useBrowser} from '@/composables/useBrowser'
import DialogPort from '@/components/DialogPort.vue'
import type {MenuActionType} from '@/types'
import {CODES} from '@/config/codes'

const {t} = useI18n()
const {openOptionsPage} = useBrowser()
const runtime = useRuntimeStore()
const {isStockLoading} = storeToRefs(runtime)
const records = useRecordsStore()
const {info} = useAlertStore()
const {items: accountItems} = storeToRefs(records.accounts)
const {items: bookingItems} = storeToRefs(records.bookings)
const {items: bookingTypeItems} = storeToRefs(records.bookingTypes)

/**
 * Registry of dialog actions for the header bar menu.
 * Maps action identifiers to functions that trigger component teleports.
 */
const dialogActions: Record<MenuActionType, () => void | Promise<void>> = {
    updateQuote: async () => {
        isStockLoading.value = true
        await records.stocks.loadOnlineData(runtime.stocksPage)
        isStockLoading.value = false
    },

    fadeInStock: async () => {
        if (records.stocks.passive.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noRecords'), null)
        } else {
            runtime.setTeleport(
                {
                    dialogName: 'fadeInStock',
                    dialogOk: true,
                    dialogVisibility: true
                }
            )
        }
    },

    addStock: () => {
        runtime.setTeleport(
            {
                dialogName: 'addStock',
                dialogOk: true,
                dialogVisibility: true
            }
        )
    },

    updateStock: () => {
        runtime.setTeleport(
            {
                dialogName: 'updateStock',
                dialogOk: true,
                dialogVisibility: true
            }
        )
    },

    deleteStock: () => {
    },

    addAccount: () => {
        runtime.setTeleport(
            {
                dialogName: 'addAccount',
                dialogOk: true,
                dialogVisibility: true
            }
        )
    },

    updateAccount: () => {
        if (accountItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noAccount'), null)
        } else {
            runtime.setTeleport(
                {
                    dialogName: 'updateAccount',
                    dialogOk: true,
                    dialogVisibility: true
                }
            )
        }
    },

    deleteAccountConfirmation: () => {
        if (accountItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noAccount'), null)
        } else {
            runtime.setTeleport(
                {
                    dialogName: 'deleteAccountConfirmation',
                    dialogOk: true,
                    dialogVisibility: true
                }
            )
        }
    },

    addBookingType: () => {
        if (accountItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.createAccount'), null)
        } else {
            runtime.setTeleport(
                {
                    dialogName: 'addBookingType',
                    dialogOk: true,
                    dialogVisibility: true
                }
            )
        }
    },

    updateBookingType: () => {
        if (bookingTypeItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noBookingTypes'), null)
        } else {
            runtime.setTeleport(
                {
                    dialogName: 'updateBookingType',
                    dialogOk: true,
                    dialogVisibility: true
                }
            )
        }
    },

    deleteBookingType: () => {
        if (bookingTypeItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noBookingTypes'), null)
        } else {
            runtime.setTeleport(
                {
                    dialogName: 'deleteBookingType',
                    dialogOk: true,
                    dialogVisibility: true
                }
            )
        }
    },

    addBooking: () => {
        if (accountItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.createAccount'), null)
        } else {
            runtime.setTeleport(
                {
                    dialogName: 'addBooking',
                    dialogOk: true,
                    dialogVisibility: true
                }
            )
        }
    },

    exportDatabase: () => {
        if (accountItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.nothingToExport'), null)
        } else {
            runtime.setTeleport(
                {
                    dialogName: 'exportDatabase',
                    dialogOk: true,
                    dialogVisibility: true
                }
            )
        }
    },

    importDatabase: () => {
        runtime.setTeleport(
            {
                dialogName: 'importDatabase',
                dialogOk: true,
                dialogVisibility: true
            }
        )
    },

    showAccounting: () => {
        if (bookingItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noBookings'), null)
        } else {
            runtime.setTeleport(
                {
                    dialogName: 'showAccounting',
                    dialogOk: false,
                    dialogVisibility: true
                }
            )
        }
    },

    deleteAccount: () => {
    },

    updateBooking: () => {
    },

    deleteBooking: () => {
    },

    showDividend: () => {
    },

    openLink: () => {
    },

    home: () => {
        runtime.setCurrentView(CODES.VIEW_CODES.HOME)
    },

    company: () => {
        runtime.setCurrentView(CODES.VIEW_CODES.COMPANY)
    },

    setting: async () => {
        await openOptionsPage()
    }
}

/**
 * Registry of validations for header bar menu items.
 * Each function returns true if the action is currently permitted.
 */
const dialogValidations: Record<MenuActionType, () => boolean> = {
    updateAccount: () => {
        if (accountItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noAccount'), null)
            return false
        }
        return true
    },
    fadeInStock: () => {
        if (records.stocks.passive.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noRecords'), null)
            return false
        }
        return true
    },
    deleteAccountConfirmation: () => {
        if (accountItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noAccount'), null)
            return false
        }
        return true
    },
    addBookingType: () => {
        if (accountItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.createAccount'), null)
            return false
        }
        return true
    },
    updateBookingType: () => {
        if (bookingTypeItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noBookingTypes'), null)
            return false
        }
        return true
    },
    deleteBookingType: () => {
        if (bookingTypeItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noBookingTypes'), null)
            return false
        }
        return true
    },
    addBooking: () => {
        if (accountItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.createAccount'), null)
            return false
        }
        return true
    },
    exportDatabase: () => {
        if (accountItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.nothingToExport'), null)
            return false
        }
        return true
    },
    showAccounting: () => {
        if (bookingItems.value.length === 0) {
            info(t('views.headerBar.infoTitle'), t('views.headerBar.messages.noBookings'), null)
            return false
        }
        return true
    },

    addAccount: () => {
        return true
    },

    deleteAccount: () => {
        return true
    },

    deleteBooking: () => {
        return true
    },

    updateBooking: () => {
        return true
    },

    updateStock: () => {
        return true
    },

    deleteStock: () => {
        return true
    },

    showDividend: () => {
        return true
    },

    addStock: () => {
        return true
    },

    importDatabase: () => {
        return true
    },

    updateQuote: () => {
        return true
    },

    home: () => {
        return true
    },

    company: () => {
        return true
    },

    setting: () => {
        return true
    },

    openLink: () => {
        return true
    }
}

const onIconClick = async (ev: Event): Promise<void> => {
    const target = ev.target as Element
    const dialogId = target.closest('[id]')?.id as keyof typeof dialogValidations

    if (!dialogId) return
    if (typeof dialogValidations[dialogId] !== 'function' || typeof dialogActions[dialogId] !== 'function') return

    await dialogActions[dialogId]()
}

UtilsService.log('--- views/HeaderBar.vue setup ---')
</script>

<template>
    <v-app-bar app flat height="75">
        <v-spacer/>
        <RouterLink
            id="home"
            class="router-link-active"
            to="/"
            @click="onIconClick">
            <v-tooltip :text="t('views.headerBar.home')" location="top">
                <template v-slot:activator="{ props }">
                    <v-app-bar-nav-icon
                        color="grey"
                        icon="$home"
                        size="large"
                        v-bind="props"
                        variant="tonal"/>
                </template>
            </v-tooltip>
        </RouterLink>
        <RouterLink
            v-if="records.accounts.isDepot"
            id="company"
            class="router-link-active"
            to="/company"
            @click="onIconClick">
            <v-tooltip :text="t('views.headerBar.company')" location="top">
                <template v-slot:activator="{ props }">
                    <v-app-bar-nav-icon
                        color="grey"
                        icon="$showCompany"
                        size="large"
                        v-bind="props"
                        variant="tonal"
                    />
                </template>
            </v-tooltip>
        </RouterLink>
        <v-spacer/>
        <v-tooltip
            v-if="runtime.getCurrentView === CODES.VIEW_CODES.COMPANY"
            :text="t('views.headerBar.updateQuote')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="updateQuote"
                    icon="$reload"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-spacer/>
        <v-tooltip
            v-if="runtime.getCurrentView === CODES.VIEW_CODES.COMPANY"
            :text="t('views.headerBar.addStock')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="addStock"
                    icon="$addCompany"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-tooltip
            v-if="runtime.getCurrentView === CODES.VIEW_CODES.COMPANY"
            :text="t('views.headerBar.fadeInStock')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="fadeInStock"
                    icon="$fadeInCompany"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-spacer/>
        <v-tooltip
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :text="t('views.headerBar.addAccount')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="addAccount"
                    icon="$addAccount"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-tooltip
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :text="t('views.headerBar.updateAccount')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="updateAccount"
                    icon="$updateAccount"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-tooltip
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :text="t('views.headerBar.deleteAccount')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="deleteAccountConfirmation"
                    icon="$deleteAccount"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-spacer/>
        <v-tooltip
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :text="t('views.headerBar.addBooking')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="addBooking"
                    icon="$addBooking"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-spacer/>
        <v-tooltip
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :text="t('views.headerBar.addBookingType')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="addBookingType"
                    icon="$addBookingType"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-tooltip
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :text="t('views.headerBar.updateBookingType')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="updateBookingType"
                    icon="$updateBookingType"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-tooltip
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :text="t('views.headerBar.deleteBookingType')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="deleteBookingType"
                    icon="$deleteBookingType"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-spacer/>
        <v-tooltip
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :text="t('views.headerBar.exportToFile')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="exportDatabase"
                    icon="$exportToFile"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-tooltip
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :text="t('views.headerBar.importDatabase')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="importDatabase"
                    icon="$importDatabase"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-spacer/>
        <v-tooltip
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :text="t('views.headerBar.showAccounting')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="showAccounting"
                    icon="$showAccounting"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-spacer/>
        <v-tooltip
            :text="t('views.headerBar.settings')"
            location="top">
            <template v-slot:activator="{ props }">
                <v-app-bar-nav-icon
                    id="setting"
                    color="grey"
                    icon="$settings"
                    size="large"
                    v-bind="props"
                    variant="tonal"
                    @click="onIconClick"/>
            </template>
        </v-tooltip>
        <v-spacer/>
    </v-app-bar>
    <DialogPort/>
</template>
