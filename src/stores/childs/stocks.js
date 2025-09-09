import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
const { log } = useApp();
export const useStocks = defineStore('stocks', () => {
    const items = ref([]);
    const getStockById = computed(() => (ident) => {
        return items.value.findIndex((entry) => entry.cID === ident);
    });
    function addStock(stock, prepend = false) {
        log('STOCKS_STORE: addStock');
        if (prepend) {
            items.value.unshift(stock);
        }
        else {
            items.value.push(stock);
        }
    }
    function updateStock(stock) {
        log('STOCKS_STORE: updateStock');
        const index = getStockById.value(stock?.cID ?? -1);
        if (index !== -1) {
            items.value[index] = { ...stock };
        }
    }
    function deleteStock(ident) {
        log('STOCKS_STORE: deleteStock', { info: ident });
        const index = getStockById.value(ident);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }
    function clean() {
        log('STOCKS_STORE: clean');
        items.value.length = 0;
    }
    return {
        items,
        getStockById,
        addStock,
        updateStock,
        deleteStock,
        clean
    };
});
log('--- STORE stocks.ts ---');
