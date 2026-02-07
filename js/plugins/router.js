import { createRouter, createWebHashHistory } from "vue-router";
import { DomainUtils } from "@/domains/utils";
import { ROUTES } from "@/config/routes";
import { CODES } from "@/config/codes";
import { useRuntimeStore } from "@/stores/runtime";
const routerInstance = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: ROUTES.HOME,
            name: CODES.VIEW_CODES.HOME,
            components: {
                default: () => import("@/views/HomeContent.vue"),
                title: () => import("@/views/TitleBar.vue"),
                header: () => import("@/views/HeaderBar.vue"),
                footer: () => import("@/views/FooterBar.vue")
            }
        },
        {
            path: ROUTES.COMPANY,
            name: CODES.VIEW_CODES.COMPANY,
            components: {
                default: () => import("@/views/CompanyContent.vue"),
                title: () => import("@/views/TitleBar.vue"),
                header: () => import("@/views/HeaderBar.vue"),
                info: () => import("@/views/InfoBar.vue"),
                footer: () => import("@/views/FooterBar.vue")
            }
        },
        {
            path: ROUTES.PRIVACY,
            name: CODES.VIEW_CODES.PRIVACY,
            components: {
                default: () => import("@/views/SheetContent.vue"),
                title: () => import("@/views/TitleBar.vue"),
                header: () => import("@/views/HeaderBar.vue"),
                footer: () => import("@/views/FooterBar.vue")
            }
        },
        {
            path: ROUTES.HELP,
            name: CODES.VIEW_CODES.HELP,
            components: {
                default: () => import("@/views/HelpContent.vue"),
                title: () => import("@/views/TitleBar.vue"),
                header: () => import("@/views/HeaderBar.vue"),
                footer: () => import("@/views/FooterBar.vue")
            }
        }
    ]
});
routerInstance.afterEach((to) => {
    try {
        const runtime = useRuntimeStore();
        const routeName = to.name;
        if (routeName) {
            runtime.setCurrentView(routeName);
        }
    }
    catch {
    }
});
routerInstance.isReady().then(() => {
    try {
        const runtime = useRuntimeStore();
        const routeName = routerInstance.currentRoute.value.name;
        if (routeName) {
            runtime.setCurrentView(routeName);
        }
    }
    catch {
    }
});
const routerConfig = {
    router: routerInstance
};
export default routerConfig;
DomainUtils.log("PLUGINS Router");
