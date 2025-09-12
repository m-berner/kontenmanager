import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
const { log } = useApp();
export const useBookingTypes = defineStore('bookingTypes', () => {
    const items = ref([]);
    const getNameById = computed(() => (ident) => {
        const bookingType = items.value.find((entry) => entry.cID === ident);
        return bookingType ? bookingType.cName : '';
    });
    const getById = computed(() => (ident) => {
        const bookingType = items.value.find((entry) => entry.cID === ident);
        return bookingType ? bookingType : null;
    });
    const getIndexById = computed(() => (id) => {
        return items.value.findIndex(bookingType => bookingType.cID === id);
    });
    const isDuplicate = computed(() => (name) => {
        const duplicates = items.value.filter((entry) => entry.cName === name);
        return duplicates.length > 0;
    });
    const getNames = computed(() => items.value.map(item => item.cName));
    const getNamesWithIndex = computed(() => items.value.map((item, index) => ({
        name: item.cName,
        index
    })));
    function add(bookingType, prepend = false) {
        log('BOOKING_TYPES_STORE: add');
        if (prepend) {
            items.value.unshift(bookingType);
        }
        else {
            items.value.push(bookingType);
        }
    }
    function update(bookingType) {
        log('BOOKING_TYPES_STORE: update');
        const index = getIndexById.value(bookingType.cID);
        if (index !== -1) {
            items.value[index] = { ...bookingType };
        }
    }
    function remove(ident) {
        log('BOOKING_TYPE_STORE: remove', { info: ident });
        const index = getIndexById.value(ident);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }
    function clean() {
        log('BOOKING_TYPES_STORE: clean');
        items.value.length = 0;
    }
    return {
        items,
        getById,
        getNameById,
        getIndexById,
        getNames,
        getNamesWithIndex,
        isDuplicate,
        add,
        remove,
        update,
        clean
    };
});
log('--- STORES bookingTypes.ts ---');
