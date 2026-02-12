import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { DomainUtils } from "@/domains/utils";
import { CODES } from "@/configs/codes";
export const useRuntimeStore = defineStore("runtime", function () {
    const activeId = ref(-1);
    const currentView = ref(CODES.VIEW_CODES.HOME);
    const optionMenuColors = ref(new Map());
    const dialogName = ref();
    const dialogOk = ref(true);
    const dialogVisibility = ref(false);
    const infoExchanges = ref(new Map());
    const infoIndexes = ref(new Map());
    const infoMaterials = ref(new Map());
    const curUsd = ref(1);
    const curEur = ref(1);
    const stocksPage = ref(1);
    const isDownloading = ref(false);
    const isStockLoading = ref(false);
    const getCurrentView = computed(() => currentView.value);
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
        dialogName.value = undefined;
        dialogOk.value = true;
        dialogVisibility.value = false;
        resetOptionsMenuColors();
    }
    function resetOptionsMenuColors() {
        if (optionMenuColors.value.size > 0) {
            optionMenuColors.value.clear();
        }
    }
    function setCurrentView(view) {
        currentView.value = view;
        resetTeleport();
    }
    return {
        activeId,
        getCurrentView,
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
        isDownloading,
        isStockLoading,
        setTeleport,
        resetTeleport,
        resetOptionsMenuColors,
        clearStocksPages,
        setCurrentView
    };
});
DomainUtils.log("STORES runtime");
