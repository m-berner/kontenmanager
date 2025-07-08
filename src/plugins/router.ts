/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {createRouter, createWebHashHistory, type Router} from 'vue-router'
import {useAppApi} from '@/pages/background'

interface IRouter {
  router: Router
}

const {log} = useAppApi()

export default<IRouter> {
  router: createRouter({
    history: createWebHashHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        components: {
          default: () => import('@/components/HomeContent.vue'),
          title: () => import('@/components/TitleBar.vue'),
          header: () => import ('@/components/HeaderBar.vue'),
          footer: () => import('@/components/FooterBar.vue')
        }
      },
      {
        path: '/company',
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
        path: '/help',
        name: 'help',
        components: {
          default: () => import('@/components/HelpContent.vue'),
          title: () => import('@/components/TitleBar.vue'),
          header: () => import ('@/components/HeaderBar.vue'),
          footer: () => import('@/components/FooterBar.vue')
        }
      },
      {
        path: '/privacy',
        name: 'privacy',
        components: {
          default: () => import('@/components/PrivacyContent.vue'),
          title: () => import('@/components/TitleBar.vue'),
          header: () => import ('@/components/HeaderBar.vue'),
          footer: () => import('@/components/FooterBar.vue')
        }
      }
    ]
  })
}

log('--- PLUGINS router.js ---')
