/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createRouter, createWebHashHistory} from "vue-router";
import {DomainUtils} from "@/domains/utils";
import type {RouterWrapper, ViewTypeSelectionType} from "@/types";
import {VIEW_CODES} from "@/configs/codes";
import {useRuntimeStore} from "@/stores/runtime";

/**
 * Global router instance configured with hash history suitable for WebExtensions.
 *
 * Lazily loads view components and maps them to named views (default, title,
 * header, info, footer) per route.
 */
const routerInstance = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: "/",
            name: VIEW_CODES.HOME,
            components: {
                default: () => import("@/views/HomeContent.vue"),
                title: () => import("@/views/TitleBar.vue"),
                header: () => import("@/views/HeaderBar.vue"),
                footer: () => import("@/views/FooterBar.vue")
            }
        },
        {
            path: `/${VIEW_CODES.COMPANY}`,
            name: VIEW_CODES.COMPANY,
            components: {
                default: () => import("@/views/CompanyContent.vue"),
                title: () => import("@/views/TitleBar.vue"),
                header: () => import("@/views/HeaderBar.vue"),
                info: () => import("@/views/InfoBar.vue"),
                footer: () => import("@/views/FooterBar.vue")
            }
        },
        {
            path: `/${VIEW_CODES.PRIVACY}`,
            name: VIEW_CODES.PRIVACY,
            components: {
                default: () => import("@/views/SheetContent.vue"),
                title: () => import("@/views/TitleBar.vue"),
                header: () => import("@/views/HeaderBar.vue"),
                footer: () => import("@/views/FooterBar.vue")
            }
        },
        {
            path: `/${VIEW_CODES.HELP}`,
            name: VIEW_CODES.HELP,
            components: {
                default: () => import("@/views/HelpContent.vue"),
                title: () => import("@/views/TitleBar.vue"),
                header: () => import("@/views/HeaderBar.vue"),
                footer: () => import("@/views/FooterBar.vue")
            }
        }
    ]
});

/**
 * After-each navigation hook to keep the runtime store's `currentView` in sync
 * with the active route. This also covers hard reloads so layout components can
 * render the correct state.
 *
 * @param to - The target route.
 */
routerInstance.afterEach((to) => {
    try {
        const runtime = useRuntimeStore();
        const routeName = to.name as ViewTypeSelectionType;
        if (routeName) {
            runtime.setCurrentView(routeName);
        }
    } catch {
        // Pinia might not be ready in some unit-test contexts; fail silently
    }
});

/**
 * Synchronize once when the router becomes ready to cover the first
 * navigation on page load.
 */
routerInstance.isReady().then(() => {
    try {
        const runtime = useRuntimeStore();
        const routeName = routerInstance.currentRoute.value.name as ViewTypeSelectionType;
        if (routeName) {
            runtime.setCurrentView(routeName);
        }
    } catch {
        // Ignore if Pinia is not active in this context
    }
});

/**
 * Exported wrapper exposing the configured Router instance for app setup.
 */
const routerConfig: RouterWrapper = {
    router: routerInstance
};

export default routerConfig;

DomainUtils.log("PLUGINS router");
