import { INDEXED_DB } from '@/configurations/indexed_db';
import { DATE } from '@/configurations/date';
import { DEFAULTS } from '@/configurations/defaults';
import { SESSION_STORAGE } from '@/configurations/storage';
import { LOCAL_STORAGE } from '@/configurations/storage';
import { BROWSER_STORAGE } from '@/configurations/storage';
import { PAGES } from '@/configurations/pages';
import { EVENTS } from '@/configurations/events';
import { SERVICES } from '@/configurations/services';
import { SETTINGS } from '@/configurations/settings';
import { STATES } from '@/configurations/states';
import { CURRENCIES } from '@/configurations/currencies';
import { COMPONENTS } from '@/configurations/components';
import { ROUTES } from '@/configurations/routes';
import { SYSTEM } from '@/configurations/system';
export function useAppConfig() {
    return {
        BROWSER_STORAGE,
        COMPONENTS,
        CURRENCIES,
        DATE,
        DEFAULTS,
        EVENTS,
        INDEXED_DB,
        LOCAL_STORAGE,
        PAGES,
        ROUTES,
        SERVICES,
        SESSION_STORAGE,
        SETTINGS,
        STATES,
        SYSTEM
    };
}
