/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {Router} from 'vue-router'
import {createRouter, createWebHashHistory} from 'vue-router'
import {useApp} from '@/composables/useApp'

interface IRouter {
    router: Router
}

const {CONS, log} = useApp()

const routerInstance = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: CONS.ROUTES.HOME,
            name: 'home',
            components: {
                default: () => import('@/components/HomeContent.vue'),
                title: () => import('@/components/TitleBar.vue'),
                header: () => import ('@/components/HeaderBar.vue'),
                footer: () => import('@/components/FooterBar.vue')
            }
        },
        {
            path: CONS.ROUTES.COMPANY,
            name: 'company',
            components: {
                default: () => import('@/components/CompanyContent.vue'),
                title: () => import('@/components/TitleBar.vue'),
                header: () => import ('@/components/HeaderBar.vue'),
                info: () => import ('@/components/InfoBar.vue'),
                footer: () => import('@/components/FooterBar.vue')
            }
        },
        {
            path: CONS.ROUTES.HELP,
            name: 'help',
            components: {
                default: () => import('@/components/SheetContent.vue'),
                title: () => import('@/components/TitleBar.vue'),
                header: () => import ('@/components/HeaderBar.vue'),
                footer: () => import('@/components/FooterBar.vue')
            }
        },
        {
            path: CONS.ROUTES.PRIVACY,
            name: 'privacy',
            components: {
                default: () => import('@/components/SheetContent.vue'),
                title: () => import('@/components/TitleBar.vue'),
                header: () => import ('@/components/HeaderBar.vue'),
                footer: () => import('@/components/FooterBar.vue')
            }
        }
    ]
})

const routerConfig: IRouter = {
    router: routerInstance
}

export default routerConfig

log('--- PLUGINS router.js ---')
