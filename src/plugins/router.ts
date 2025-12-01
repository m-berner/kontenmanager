/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {createRouter, createWebHashHistory} from 'vue-router'
import {useApp} from '@/composables/useApp'
import type {IRouter} from '@/types'

const {CONS, log} = useApp()

const routerInstance = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: CONS.ROUTES.HOME,
            name: 'home',
            components: {
                default: () => import('@/screens/HomeContent.vue'),
                title: () => import('@/screens/TitleBar.vue'),
                header: () => import ('@/screens/HeaderBar.vue'),
                footer: () => import('@/screens/FooterBar.vue')
            }
        },
        {
            path: CONS.ROUTES.COMPANY,
            name: 'company',
            components: {
                default: () => import('@/screens/CompanyContent.vue'),
                title: () => import('@/screens/TitleBar.vue'),
                header: () => import ('@/screens/HeaderBar.vue'),
                info: () => import ('@/screens/InfoBar.vue'),
                footer: () => import('@/screens/FooterBar.vue')
            }
        },
        {
            path: CONS.ROUTES.PRIVACY,
            name: 'privacy',
            components: {
                default: () => import('@/screens/SheetContent.vue'),
                title: () => import('@/screens/TitleBar.vue'),
                header: () => import ('@/screens/HeaderBar.vue'),
                footer: () => import('@/screens/FooterBar.vue')
            }
        }
    ]
})

const routerConfig: IRouter = {
    router: routerInstance
}

export default routerConfig

log('--- PLUGINS router.js ---')
