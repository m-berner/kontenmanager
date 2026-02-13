import { createRouter, createWebHashHistory } from "vue-router";
import { DomainUtils } from "@/domains/utils";
import { VIEW_CODES } from "@/configs/codes";
import { useRuntimeStore } from "@/stores/runtime";
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
DomainUtils.log("PLUGINS router");
