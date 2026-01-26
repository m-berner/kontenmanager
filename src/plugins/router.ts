/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {createRouter, createWebHashHistory} from 'vue-router'
import {UtilsService} from '@/domains/utils'
import type {RouterWrapper} from '@/types'
import {ROUTES} from '@/config/routes'
import {CODES} from '@/config/codes'

const routerInstance = createRouter(
    {
        history: createWebHashHistory(),
        routes: [
            {
                path: ROUTES.HOME,
                name: CODES.VIEW_CODES.HOME,
                components: {
                    default: () => import('@/views/HomeContent.vue'),
                    title: () => import('@/views/TitleBar.vue'),
                    header: () => import ('@/views/HeaderBar.vue'),
                    footer: () => import('@/views/FooterBar.vue')
                }
            },
            {
                path: ROUTES.COMPANY,
                name: CODES.VIEW_CODES.COMPANY,
                components: {
                    default: () => import('@/views/CompanyContent.vue'),
                    title: () => import('@/views/TitleBar.vue'),
                    header: () => import ('@/views/HeaderBar.vue'),
                    info: () => import ('@/views/InfoBar.vue'),
                    footer: () => import('@/views/FooterBar.vue')
                }
            },
            {
                path: ROUTES.PRIVACY,
                name: CODES.VIEW_CODES.PRIVACY,
                components: {
                    default: () => import('@/views/SheetContent.vue'),
                    title: () => import('@/views/TitleBar.vue'),
                    header: () => import ('@/views/HeaderBar.vue'),
                    footer: () => import('@/views/FooterBar.vue')
                }
            }
        ]
    }
)

const routerConfig: RouterWrapper = {
    router: routerInstance
}

export default routerConfig

UtilsService.log('--- plugins/router.js ---')
