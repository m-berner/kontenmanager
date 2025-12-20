import { createRouter, createWebHashHistory } from 'vue-router';
import { useApp } from '@/composables/useApp';
import { useAppConfig } from '@/composables/useAppConfig';
const { log } = useApp();
const { ROUTES } = useAppConfig();
const routerInstance = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: ROUTES.HOME,
            name: 'home',
            components: {
                default: () => import('@/screens/HomeContent.vue'),
                title: () => import('@/screens/TitleBar.vue'),
                header: () => import('@/screens/HeaderBar.vue'),
                footer: () => import('@/screens/FooterBar.vue')
            }
        },
        {
            path: ROUTES.COMPANY,
            name: 'company',
            components: {
                default: () => import('@/screens/CompanyContent.vue'),
                title: () => import('@/screens/TitleBar.vue'),
                header: () => import('@/screens/HeaderBar.vue'),
                info: () => import('@/screens/InfoBar.vue'),
                footer: () => import('@/screens/FooterBar.vue')
            }
        },
        {
            path: ROUTES.PRIVACY,
            name: 'privacy',
            components: {
                default: () => import('@/screens/SheetContent.vue'),
                title: () => import('@/screens/TitleBar.vue'),
                header: () => import('@/screens/HeaderBar.vue'),
                footer: () => import('@/screens/FooterBar.vue')
            }
        }
    ]
});
const routerConfig = {
    router: routerInstance
};
export default routerConfig;
log('--- PLUGINS router.js ---');
