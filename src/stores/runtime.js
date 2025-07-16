import { defineStore } from 'pinia';
import { useApp } from '@/pages/background';
import { useRecordsStore } from '@/stores/records';
import { useSettingsStore } from '@/stores/settings';
const { CONS, log } = useApp();
export const useRuntimeStore = defineStore('runtime', {
    state: () => {
        return {
            bookingId: -1,
            logo: CONS.LOGOS.NO_LOGO,
            teleport: {
                dialogName: '',
                okButton: true,
                visibility: false
            },
            infoBar: {
                exchanges: new Map(),
                indexes: new Map(),
                materials: new Map()
            },
            exchanges: {
                curUsd: 1,
                curEur: 1
            },
        };
    },
    getters: {
        materials: (state) => state.infoBar.materials,
        exchanges: (state) => state.infoBar.exchanges,
        indexes: (state) => state.infoBar.indexes,
        exchangesCurUsd: (state) => state.exchanges.curUsd,
        hasActiveBooking: (state) => state.bookingId !== -1,
        isDialogVisible: (state) => state.teleport.visibility,
        currentDialog: (state) => state.teleport.dialogName,
        hasLogo: (state) => state.logo !== CONS.LOGOS.NO_LOGO,
        dialogConfig: (state) => ({ ...state.teleport }),
        currentBookingInfo: (state) => {
            if (state.bookingId === -1)
                return null;
            const records = useRecordsStore();
            const bookingIndex = records.getBookingById(state.bookingId);
            return bookingIndex !== -1 ? records.bookings[bookingIndex] : null;
        }
    },
    actions: {
        setLogo() {
            const records = useRecordsStore();
            const settings = useSettingsStore();
            this.logo = CONS.LOGOS.NO_LOGO;
            if (settings.activeAccountId > -1) {
                const accountIndex = records.getAccountIndexById(settings.activeAccountId);
                if (accountIndex !== -1) {
                    const account = records.accounts[accountIndex];
                    this.logo = account.cLogoUrl;
                }
            }
        },
        setBookingId(value) {
            this.bookingId = value;
        },
        setTeleport(entry) {
            this.teleport = {
                dialogName: entry.dialogName,
                okButton: entry.okButton,
                visibility: entry.visibility
            };
        },
        resetTeleport() {
            this.teleport = {
                dialogName: '',
                okButton: true,
                visibility: false,
            };
        },
        openDialog(dialogName, showOkButton = true) {
            this.teleport = {
                dialogName,
                okButton: showOkButton,
                visibility: true
            };
        },
        closeDialog() {
            this.teleport.visibility = false;
        },
        toggleDialog() {
            this.teleport.visibility = !this.teleport.visibility;
        },
        updateDialogConfig(config) {
            this.teleport = {
                ...this.teleport,
                ...config
            };
        },
        clearBooking() {
            this.bookingId = -1;
        },
        setBookingAndOpenDialog(bookingId, dialogName) {
            this.bookingId = bookingId;
            this.openDialog(dialogName);
        },
        resetRuntimeState() {
            this.bookingId = -1;
            this.logo = CONS.LOGOS.NO_LOGO;
            this.resetTeleport();
        },
        updateLogoSafely() {
            try {
                this.setLogo();
            }
            catch (error) {
                log('ERROR: Failed to update logo', { info: error });
                this.logo = CONS.LOGOS.NO_LOGO;
            }
        },
        setExchangesUsd(value) {
            this.exchanges.curUsd = value;
        },
        setExchangesEur(value) {
            this.exchanges.curEur = value;
        },
    }
});
log('--- STORE runtime.js ---');
