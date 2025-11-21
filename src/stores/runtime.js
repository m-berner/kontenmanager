import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
const { log } = useApp();
export const useRuntimeStore = defineStore('runtime', function () {
    const activeId = ref(-1);
    const optionMenuColors = ref(new Map());
    const dialogName = ref('');
    const dialogOk = ref(true);
    const dialogVisibility = ref(false);
    const infoExchanges = ref(new Map());
    const infoIndexes = ref(new Map());
    const infoMaterials = ref(new Map());
    const curUsd = ref(1);
    const curEur = ref(1);
    const stocksPage = ref(1);
    const isCompanyPage = ref(false);
    const isDownloading = ref(false);
    const loadedStocksPages = new Set();
    function clearStocksPages() {
        loadedStocksPages.clear();
    }
    function setTeleport(entry) {
        dialogName.value = entry.dialogName;
        dialogOk.value = entry.dialogOk;
        dialogVisibility.value = entry.dialogVisibility;
    }
    function resetTeleport() {
        dialogName.value = '';
        dialogOk.value = true;
        dialogVisibility.value = false;
        for (const m of optionMenuColors.value.keys()) {
            optionMenuColors.value.set(m, '');
        }
    }
    function resetOptionsMenuColors() {
        for (const m of optionMenuColors.value.keys()) {
            optionMenuColors.value.set(m, '');
        }
    }
    return {
        activeId,
        optionMenuColors,
        dialogName,
        dialogOk,
        dialogVisibility,
        infoExchanges,
        infoIndexes,
        infoMaterials,
        curUsd,
        curEur,
        stocksPage,
        loadedStocksPages,
        isCompanyPage,
        isDownloading,
        setTeleport,
        resetTeleport,
        resetOptionsMenuColors,
        clearStocksPages
    };
});
log('--- STORES runtime.ts ---');
