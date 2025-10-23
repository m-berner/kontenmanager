import { createRouter, createWebHashHistory } from 'vue-router';
import { useApp } from '@/composables/useApp';
const { CONS, log } = useApp();
const routerInstance = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: CONS.ROUTES.HOME,
            name: 'home',
            components: {
                default: () => import('@/components/HomeContent.vue'),
                title: () => import('@/components/TitleBar.vue'),
                header: () => import('@/components/HeaderBar.vue'),
                footer: () => import('@/components/FooterBar.vue')
            }
        },
        {
            path: CONS.ROUTES.COMPANY,
            name: 'company',
            components: {
                default: () => import('@/components/CompanyContent.vue'),
                title: () => import('@/components/TitleBar.vue'),
                header: () => import('@/components/HeaderBar.vue'),
                info: () => import('@/components/InfoBar.vue'),
                footer: () => import('@/components/FooterBar.vue')
            }
        },
        {
            path: CONS.ROUTES.PRIVACY,
            name: 'privacy',
            components: {
                default: () => import('@/components/SheetContent.vue'),
                title: () => import('@/components/TitleBar.vue'),
                header: () => import('@/components/HeaderBar.vue'),
                footer: () => import('@/components/FooterBar.vue')
            }
        }
    ]
});
const routerConfig = {
    router: routerInstance
};
export default routerConfig;
log('--- PLUGINS router.js ---');
