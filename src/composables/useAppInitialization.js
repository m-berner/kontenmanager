import {useApp} from '@/composables/useApp';
import {useBrowser} from '@/composables/useBrowser';
import {useRecordsStore} from '@/stores/records';
import {useSettingsStore} from '@/stores/settings';
import {useRuntimeStore} from '@/stores/runtime';
import {storeToRefs} from 'pinia';
import {useIndexedDB} from '@/composables/useIndexedDB';
import {useFetch} from '@/composables/useFetch';

const {CONS} = useApp();
const processExchangeBase = (baseData) => {
    const runtime = useRuntimeStore();
    const {curUsd, curEur} = storeToRefs(runtime);
    baseData.forEach((data) => {
        if (data.key.includes(CONS.CURRENCIES.USD)) {
            curUsd.value = data.value;
        } else {
            curEur.value = data.value;
        }
    });
};
const processExchangeInfo = (infoData) => {
    const runtime = useRuntimeStore();
    infoData.forEach((data) => {
        runtime.infoExchanges.set(data.key, data.value);
    });
};
const processIndexesInfo = (indexesData) => {
    const runtime = useRuntimeStore();
    indexesData.forEach((data) => {
        runtime.infoIndexes.set(data.key, data.value);
    });
};
const processMaterialsInfo = (materialsData) => {
    const runtime = useRuntimeStore();
    materialsData.forEach((data) => {
        runtime.infoMaterials.set(data.key, data.value);
    });
};
export const useAppInitialization = () => {
    const records = useRecordsStore();
    const settings = useSettingsStore();
    const {exchanges} = storeToRefs(settings);
    const {installStorageLocal, uiLanguage} = useBrowser();
    const {getDatabaseStores} = useIndexedDB();
    const {fetchExchangesData, fetchIndexData, fetchMaterialData} = useFetch();
    const initializeApp = async (T) => {
        const results = {
            storage: null,
            database: null,
            exchanges: [],
            indexes: [],
            materials: []
        };
        try {
            const cur = CONS.CURRENCIES.CODE.get(uiLanguage.value);
            const CUR_EUR = `${cur}${CONS.CURRENCIES.EUR}`;
            const CUR_USD = `${cur}${CONS.CURRENCIES.USD}`;
            results.storage = await installStorageLocal();
            settings.init(results.storage);
            results.database = await getDatabaseStores(settings.activeAccountId);
            await records.init(results.database, T.MESSAGES);
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
            return {success: true, results};
        } catch (error) {
            return {success: false, error};
        }
    };
    return {
        initializeApp
    };
};
