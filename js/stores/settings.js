import { ref } from "vue";
import { DomainUtils } from "@/domains/utils";
import { defineStore } from "pinia";
import { useStorage } from "@/composables/useStorage";
import { useAlert } from "@/composables/useAlert";
import { BROWSER_STORAGE } from "@/domains/configs/storage";
import { useTheme } from "vuetify";
export const useSettingsStore = defineStore("settings", function () {
    const { setStorage, addStorageChangedListener } = useStorage();
    const { handleUserError } = useAlert();
    const theme = useTheme();
    const skin = ref(BROWSER_STORAGE.SKIN.value);
    const bookingsPerPage = ref(BROWSER_STORAGE.BOOKINGS_PER_PAGE.value);
    const stocksPerPage = ref(BROWSER_STORAGE.STOCKS_PER_PAGE.value);
    const dividendsPerPage = ref(BROWSER_STORAGE.DIVIDENDS_PER_PAGE.value);
    const sumsPerPage = ref(BROWSER_STORAGE.SUMS_PER_PAGE.value);
    const activeAccountId = ref(-1);
    const service = ref(BROWSER_STORAGE.SERVICE.value);
    const materials = ref([...BROWSER_STORAGE.MATERIALS.value]);
    const markets = ref([...BROWSER_STORAGE.MARKETS.value]);
    const indexes = ref([...BROWSER_STORAGE.INDEXES.value]);
    const exchanges = ref([...BROWSER_STORAGE.EXCHANGES.value]);
    async function updateSetting(refVar, key, value) {
        const prev = refVar.value;
        refVar.value = value;
        try {
            await setStorage(key, value);
        }
        catch (err) {
            refVar.value = prev;
            await handleUserError("STORES Settings", err, {});
        }
    }
    function init(storage) {
        DomainUtils.log("STORES settings: init");
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
        addStorageChangedListener((changes) => {
            DomainUtils.log("STORES settings: cross-context sync");
            if (changes[BROWSER_STORAGE.SKIN.key]) {
                const newValue = changes[BROWSER_STORAGE.SKIN.key].newValue;
                skin.value = newValue;
                if (theme?.global?.name) {
                    theme.global.name.value = newValue;
                }
            }
            if (changes[BROWSER_STORAGE.SERVICE.key]) {
                service.value = changes[BROWSER_STORAGE.SERVICE.key].newValue;
            }
            if (changes[BROWSER_STORAGE.INDEXES.key]) {
                indexes.value = [...changes[BROWSER_STORAGE.INDEXES.key].newValue];
            }
            if (changes[BROWSER_STORAGE.MARKETS.key]) {
                markets.value = [...changes[BROWSER_STORAGE.MARKETS.key].newValue];
            }
            if (changes[BROWSER_STORAGE.MATERIALS.key]) {
                materials.value = [
                    ...changes[BROWSER_STORAGE.MATERIALS.key].newValue
                ];
            }
            if (changes[BROWSER_STORAGE.EXCHANGES.key]) {
                exchanges.value = [
                    ...changes[BROWSER_STORAGE.EXCHANGES.key].newValue
                ];
            }
            if (changes[BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key]) {
                activeAccountId.value =
                    changes[BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key].newValue;
            }
            if (changes[BROWSER_STORAGE.BOOKINGS_PER_PAGE.key]) {
                bookingsPerPage.value =
                    changes[BROWSER_STORAGE.BOOKINGS_PER_PAGE.key].newValue;
            }
            if (changes[BROWSER_STORAGE.STOCKS_PER_PAGE.key]) {
                stocksPerPage.value =
                    changes[BROWSER_STORAGE.STOCKS_PER_PAGE.key].newValue;
            }
            if (changes[BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key]) {
                dividendsPerPage.value =
                    changes[BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key].newValue;
            }
            if (changes[BROWSER_STORAGE.SUMS_PER_PAGE.key]) {
                sumsPerPage.value =
                    changes[BROWSER_STORAGE.SUMS_PER_PAGE.key].newValue;
            }
        });
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
DomainUtils.log("STORES settings");
