import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
const { log } = useApp();
export const useStocks = defineStore('stocks', () => {
    const items = ref([]);
    const getIndexById = computed(() => (id) => {
        return items.value.findIndex(stock => stock.cID === id);
    });
    const getItemById = computed(() => (id) => items.value[getIndexById.value(id)]);
    function add(stock, prepend = false) {
        log('STOCKS_STORE: add');
        if (prepend) {
            items.value.unshift(stock);
        }
        else {
            items.value.push(stock);
        }
    }
    function updateStock(stock) {
        log('STOCKS_STORE: updateStock');
        const index = getIndexById.value(stock?.cID ?? -1);
        if (index !== -1) {
            items.value[index] = { ...stock };
        }
    }
    function remove(ident) {
        log('STOCKS_STORE: remove', { info: ident });
        const index = getIndexById.value(ident);
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
        getItemById,
        getIndexById,
        add,
        updateStock,
        remove,
        clean
    };
});
log('--- STORES stocks.ts ---');
