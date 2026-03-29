/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createRouter, createWebHashHistory, type RouteRecordRaw} from "vue-router";

import type {ViewPathType, ViewTypeSelectionType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useRuntimeStore} from "@/adapters/primary/stores/runtime";

type RouteMeta = Omit<RouteRecordRaw, "path" | "name"> & {
    path: ViewPathType
    name: ViewTypeSelectionType
}

const routes: RouteMeta[] = [
    {
        path: "/",
        name: "home",
        components: {
            default: () => import("@/adapters/primary/views/HomeContent.vue"),
            title: () => import("@/adapters/primary/views/TitleBar.vue"),
            header: () => import("@/adapters/primary/views/HeaderBar.vue"),
            footer: () => import("@/adapters/primary/views/FooterBar.vue")
        }
    },
    {
        path: "/company",
        name: "company",
        components: {
            default: () => import("@/adapters/primary/views/CompanyContent.vue"),
            title: () => import("@/adapters/primary/views/TitleBar.vue"),
            header: () => import("@/adapters/primary/views/HeaderBar.vue"),
            info: () => import("@/adapters/primary/views/InfoBar.vue"),
            footer: () => import("@/adapters/primary/views/FooterBar.vue")
        }
    },
    {
        path: "/privacy",
        name: "privacy",
        components: {
            default: () => import("@/adapters/primary/views/PrivacyContent.vue"),
            title: () => import("@/adapters/primary/views/TitleBar.vue"),
            header: () => import("@/adapters/primary/views/HeaderBar.vue"),
            footer: () => import("@/adapters/primary/views/FooterBar.vue")
        }
    },
    {
        path: "/help",
        name: "help",
        components: {
            default: () => import("@/adapters/primary/views/HelpContent.vue"),
            title: () => import("@/adapters/primary/views/TitleBar.vue"),
            header: () => import("@/adapters/primary/views/HeaderBar.vue"),
            footer: () => import("@/adapters/primary/views/FooterBar.vue")
        }
    }
]
/**
 * Global router instance configured with hash history suitable for WebExtensions.
 *
 * Lazily loads view components and maps them to named views (default, title,
 * header, info, footer) per route.
 */
const routerInstance = createRouter({
    history: createWebHashHistory(),
    routes: routes as RouteRecordRaw[]
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
    } catch (err) {
        // Pinia might not be ready in some unit-test contexts; fail silently.
        void err;
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
    } catch (err) {
        // Ignore if Pinia is not active in this context.
        void err;
    }
});

/**
 * Exported wrapper exposing the configured Router instance for app setup.
 */
export default routerInstance;

log("PLUGINS router");
