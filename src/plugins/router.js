import { createRouter, createWebHashHistory } from 'vue-router';
import { useAppApi } from '@/pages/background';
const { log } = useAppApi();
const routerInstance = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            components: {
                default: () => import('@/components/HomeContent.vue'),
                title: () => import('@/components/TitleBar.vue'),
                header: () => import('@/components/HeaderBar.vue'),
                footer: () => import('@/components/FooterBar.vue')
            }
        },
        {
            path: '/company',
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
            path: '/help',
            name: 'help',
            components: {
                default: () => import('@/components/HelpContent.vue'),
                title: () => import('@/components/TitleBar.vue'),
                header: () => import('@/components/HeaderBar.vue'),
                footer: () => import('@/components/FooterBar.vue')
            }
        },
        {
            path: '/privacy',
            name: 'privacy',
            components: {
                default: () => import('@/components/PrivacyContent.vue'),
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
