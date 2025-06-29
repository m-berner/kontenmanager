import { defineStore } from 'pinia';
import { useAppApi } from '@/pages/background';
import { useRecordsStore } from '@/stores/records';
import { useSettingsStore } from '@/stores/settings';
const { CONS, log } = useAppApi();
export const useRuntimeStore = defineStore('runtime', {
    state: () => {
        return {
            bookingId: -1,
            logo: CONS.LOGOS.NO_LOGO,
            teleport: {
                dialogName: '',
                okButton: true,
                visibility: false
            }
        };
    },
    getters: {},
    actions: {
        setLogo() {
            const records = useRecordsStore();
            const settings = useSettingsStore();
            if (settings.activeAccountId > -1) {
                this.logo = records.accounts[records.getAccountIndexById(settings.activeAccountId)].cLogoUrl;
            }
            else {
                this.logo = CONS.LOGOS.NO_LOGO;
            }
        },
        setBookingId(value) {
            this.bookingId = value;
        },
        setTeleport(entry) {
            this.teleport = entry;
        },
        resetTeleport() {
            this.teleport = {
                dialogName: '',
                okButton: true,
                visibility: false,
            };
        }
    }
});
log('--- STORE runtime.js ---');
