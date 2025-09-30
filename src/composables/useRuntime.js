import { ref } from 'vue';
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
const loadedStocksPages = new Set();
export const useRuntime = () => {
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
        setTeleport,
        resetTeleport,
        resetOptionsMenuColors
    };
};
