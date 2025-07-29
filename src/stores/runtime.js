import { defineStore } from 'pinia';
import { useApp } from '@/pages/background';
import { useRecordsStore } from '@/stores/records';
import { useSettingsStore } from '@/stores/settings';
const { CONS, log } = useApp();
export const useRuntimeStore = defineStore('runtime', {
    state: () => {
        return {
            activeId: -1,
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
            optionMenuColors: new Map()
        };
    },
    getters: {
        hasActiveBooking: (state) => state.activeId !== -1,
        isDialogVisible: (state) => state.teleport.visibility,
        hasLogo: (state) => state.logo !== CONS.LOGOS.NO_LOGO,
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
        setActiveId(value) {
            this.activeId = value;
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
        openModalDialog(dialogName, showOkButton = true) {
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
            this.activeId = -1;
        },
        setBookingAndOpenDialog(activeId, dialogName) {
            this.activeId = activeId;
            this.openModalDialog(dialogName);
        },
        resetRuntimeState() {
            this.activeId = -1;
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
