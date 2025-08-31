import { defineStore } from 'pinia';
import { useNotification } from '@/composables/useNotification';
const { log } = useNotification();
export const useRuntimeStore = defineStore('runtime', {
    state: () => {
        return {
            activeId: -1,
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
    getters: {},
    actions: {
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
                visibility: false
            };
            for (const m of this.optionMenuColors.keys()) {
                this.optionMenuColors.set(m, '');
            }
        },
        resetOptionsMenuColors() {
            for (const m of this.optionMenuColors.keys()) {
                this.optionMenuColors.set(m, '');
            }
        },
        openModalDialog(dialogName, showOkButton = true) {
            this.teleport = {
                dialogName,
                okButton: showOkButton,
                visibility: true
            };
        },
        setExchangesUsd(value) {
            this.exchanges.curUsd = value;
        },
        setExchangesEur(value) {
            this.exchanges.curEur = value;
        }
    }
});
log('--- STORE runtime.js ---');
