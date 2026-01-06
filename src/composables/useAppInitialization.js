import { useBrowser } from '@/composables/useBrowser';
import { useRecordsStore } from '@/stores/records';
import { useSettingsStore } from '@/stores/settings';
import { useRuntimeStore } from '@/stores/runtime';
import { storeToRefs } from 'pinia';
import { useIndexedDB } from '@/composables/useIndexedDB';
import { useFetch } from '@/composables/useFetch';
import { useAppConfig } from '@/composables/useAppConfig';
const { CURRENCIES } = useAppConfig();
export const useAppInitialization = () => {
    const records = useRecordsStore();
    const settings = useSettingsStore();
    const runtime = useRuntimeStore();
    const { exchanges } = storeToRefs(settings);
    const { curUsd, curEur } = storeToRefs(runtime);
    const { getStorage, uiLanguage } = useBrowser();
    const { getDatabaseStores } = useIndexedDB();
    const { fetchExchangesData, fetchIndexData, fetchMaterialData } = useFetch();
    function processExchangeBase(baseData) {
        if (!baseData || baseData.length === 0)
            return;
        baseData.forEach((data) => {
            if (data.key.includes(CURRENCIES.USD)) {
                curUsd.value = data.value;
            }
            else if (data.key.includes(CURRENCIES.EUR)) {
                curEur.value = data.value;
            }
        });
    }
    function processExchangeInfo(infoData) {
        if (!infoData || infoData.length === 0)
            return;
        infoData.forEach((data) => {
            runtime.infoExchanges.set(data.key, data.value);
        });
    }
    function processIndexesInfo(indexesData) {
        if (!indexesData || indexesData.length === 0)
            return;
        indexesData.forEach((data) => {
            runtime.infoIndexes.set(data.key, data.value);
        });
    }
    function processMaterialsInfo(materialsData) {
        if (!materialsData || materialsData.length === 0)
            return;
        materialsData.forEach((data) => {
            runtime.infoMaterials.set(data.key, data.value);
        });
    }
    async function initializeApp(translations) {
        const storageData = await getStorage();
        settings.init(storageData);
        const cur = CURRENCIES.CODE.get(uiLanguage.value);
        if (!cur) {
            throw new Error(`Unsupported UI language: ${uiLanguage.value}`);
        }
        const databaseStores = await getDatabaseStores(settings.activeAccountId);
        await records.init(databaseStores, translations);
        const CUR_EUR = `${cur}${CURRENCIES.EUR}`;
        const CUR_USD = `${cur}${CURRENCIES.USD}`;
        const [exchangesBase, exchangesInfo, indexesInfo, materialsInfo] = await Promise.allSettled([
            fetchExchangesData([CUR_USD, CUR_EUR]),
            fetchExchangesData(exchanges.value),
            fetchIndexData(),
            fetchMaterialData()
        ]);
        if (exchangesBase.status === 'fulfilled') {
            processExchangeBase(exchangesBase.value);
        }
        if (exchangesInfo.status === 'fulfilled') {
            processExchangeInfo(exchangesInfo.value);
        }
        if (indexesInfo.status === 'fulfilled') {
            processIndexesInfo(indexesInfo.value);
        }
        if (materialsInfo.status === 'fulfilled') {
            processMaterialsInfo(materialsInfo.value);
        }
    }
    return {
        initializeApp
    };
};
