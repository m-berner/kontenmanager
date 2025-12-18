/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useAlertStore} from '@/stores/alerts'
import {useBookingsDB, useStocksDB} from '@/composables/useIndexedDB'
import {useBrowser} from '@/composables/useBrowser'
import {storeToRefs} from 'pinia'
import type {T_Menu_Action_Type} from '@/types'

export function useMenuActions() {
    const runtime = useRuntimeStore()
    const records = useRecordsStore()
    const {info} = useAlertStore()
    const {notice} = useBrowser()
    const {remove: removeBooking} = useBookingsDB()
    const {remove: removeStock} = useStocksDB()

    // Action handlers map - much cleaner than switch statement
    //const actionHandlers = {
    const actionHandlers: Record<T_Menu_Action_Type, (_recordId: number) => Promise<void>> = {
        async updateBooking(_recordId: number) {
            runtime.setTeleport(
                {
                    dialogName: 'updateBooking',
                    dialogOk: true,
                    dialogVisibility: true
                }
            )
        },

        async deleteBooking(recordId: number) {
            records.bookings.remove(recordId)
            await removeBooking(recordId)
            await notice(['Booking deleted successfully'])
        },

        async updateStock(_recordId: number) {
            runtime.setTeleport(
                {
                    dialogName: 'updateStock',
                    dialogOk: true,
                    dialogVisibility: true
                }
            )
        },

        async deleteStock(recordId: number) {
            const {items: bookingItems} = storeToRefs(records.bookings)

            // Check if stock has dependent bookings
            const hasBookings = bookingItems.value.some(
                booking => booking.cStockID === recordId
            )

            if (hasBookings) {
                info(
                    'Cannot Delete',
                    'This stock has associated bookings. Delete bookings first.',
                    null
                )
                return
            }

            records.stocks.remove(recordId)
            await removeStock(recordId)
            await notice(['Stock deleted successfully'])
        },

        async showDividend(_recordId: number) {
            runtime.setTeleport(
                {
                    dialogName: 'showDividend',
                    dialogOk: false,
                    dialogVisibility: true
                }
            )
        },

        async openLink(recordId: number) {
            const {items: stockItems} = storeToRefs(records.stocks)
            const stockIndex = records.stocks.getIndexById(recordId)
            const url = stockItems.value[stockIndex]?.cURL

            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer')
            }
        },

        async fadeInStock(_recordId: number) {

        },
        async addAccount(_recordId: number) {

        },
        async updateAccount(_recordId: number) {

        },
        async deleteAccount(_recordId: number) {

        },
        async addStock(_recordId: number) {

        },
        async addBookingType(_recordId: number) {

        },
        async deleteBookingType(_recordId: number) {

        },
        async updateBookingType(_recordId: number) {

        },
        async addBooking(_recordId: number) {

        },
        async exportDatabase(_recordId: number) {

        },
        async importDatabase(_recordId: number) {

        },
        async showAccounting(_recordId: number) {

        },
        async updateQuote(_recordId: number) {

        },
        async deleteAccountConfirmation(_recordId: number) {

        },
        async home(_recordId: number) {

        },
        async company(_recordId: number) {

        },
        async setting(_recordId: number) {

        }
    }

    const executeAction = async (
        actionType: T_Menu_Action_Type,
        recordId: number
    ): Promise<void> => {
        runtime.activeId = recordId
        const handler = actionHandlers[actionType]

        if (!handler) {
            console.error(`Unknown action type: ${actionType}`)
            return
        }

        try {
            await handler(recordId)
        } catch (error) {
            console.error(`Action ${actionType} failed:`, error)
            throw error
        }
    }

    return {executeAction}
}
