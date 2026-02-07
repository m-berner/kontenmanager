import { ref } from "vue";
import { DomainUtils } from "@/domains/utils";
import { defineStore } from "pinia";
import { useStorage } from "@/composables/useStorage";
import { useBrowser } from "@/composables/useBrowser";
import { BROWSER_STORAGE } from "@/domains/config/storage";
export const useSettingsStore = defineStore("settings", function () {
    const { setStorage } = useStorage();
    const { handleUserNotice } = useBrowser();
    const skin = ref(BROWSER_STORAGE.SKIN.value);
    const bookingsPerPage = ref(BROWSER_STORAGE.BOOKINGS_PER_PAGE.value);
    const stocksPerPage = ref(BROWSER_STORAGE.STOCKS_PER_PAGE.value);
    const dividendsPerPage = ref(BROWSER_STORAGE.DIVIDENDS_PER_PAGE.value);
    const sumsPerPage = ref(BROWSER_STORAGE.SUMS_PER_PAGE.value);
    const activeAccountId = ref(-1);
    const service = ref(BROWSER_STORAGE.SERVICE.value);
    const materials = ref(BROWSER_STORAGE.MATERIALS.value);
    const markets = ref(BROWSER_STORAGE.MARKETS.value);
    const indexes = ref(BROWSER_STORAGE.INDEXES.value);
    const exchanges = ref(BROWSER_STORAGE.EXCHANGES.value);
    async function updateSetting(refVar, key, value) {
        const prev = refVar.value;
        refVar.value = value;
        try {
            await setStorage(key, value);
        }
        catch (err) {
            refVar.value = prev;
            handleUserNotice("STORES Settings", err);
        }
    }
    function init(storage) {
        DomainUtils.log("SETTINGS: init");
        skin.value = storage[BROWSER_STORAGE.SKIN.key];
        bookingsPerPage.value = storage[BROWSER_STORAGE.BOOKINGS_PER_PAGE.key];
        stocksPerPage.value = storage[BROWSER_STORAGE.STOCKS_PER_PAGE.key];
        dividendsPerPage.value = storage[BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key];
        sumsPerPage.value = storage[BROWSER_STORAGE.SUMS_PER_PAGE.key];
        activeAccountId.value = storage[BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key];
        service.value = storage[BROWSER_STORAGE.SERVICE.key];
        materials.value = [...storage[BROWSER_STORAGE.MATERIALS.key]];
        markets.value = [...storage[BROWSER_STORAGE.MARKETS.key]];
        indexes.value = [...storage[BROWSER_STORAGE.INDEXES.key]];
        exchanges.value = [...storage[BROWSER_STORAGE.EXCHANGES.key]];
    }
    async function setSumsPerPage(v) {
        await updateSetting(sumsPerPage, BROWSER_STORAGE.SUMS_PER_PAGE.key, v);
    }
    async function setBookingsPerPage(v) {
        await updateSetting(bookingsPerPage, BROWSER_STORAGE.BOOKINGS_PER_PAGE.key, v);
    }
    async function setStocksPerPage(v) {
        await updateSetting(stocksPerPage, BROWSER_STORAGE.STOCKS_PER_PAGE.key, v);
    }
    async function setDividendsPerPage(v) {
        await updateSetting(dividendsPerPage, BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key, v);
    }
    async function setActiveAccountId(id) {
        await updateSetting(activeAccountId, BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, id);
    }
    return {
        skin,
        bookingsPerPage,
        stocksPerPage,
        dividendsPerPage,
        sumsPerPage,
        activeAccountId,
        service,
        materials,
        markets,
        indexes,
        exchanges,
        init,
        setSumsPerPage,
        setBookingsPerPage,
        setDividendsPerPage,
        setStocksPerPage,
        setActiveAccountId
    };
});
DomainUtils.log("--- stores/settings.ts ---");
