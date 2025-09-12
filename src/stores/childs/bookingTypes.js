import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApp } from '@/composables/useApp';
const { log } = useApp();
export const useBookingTypes = defineStore('bookingTypes', () => {
    const items = ref([]);
    const getBookingTypeNameById = computed(() => (ident) => {
        const bookingType = items.value.find((entry) => entry.cID === ident);
        return bookingType ? bookingType.cName : '';
    });
    const getBookingTypeById = computed(() => (ident) => {
        const bookingType = items.value.find((entry) => entry.cID === ident);
        return bookingType ? bookingType : null;
    });
    const getBookingTypeIndexById = computed(() => (id) => {
        return items.value.findIndex(bookingType => bookingType.cID === id);
    });
    const isDuplicate = computed(() => (name) => {
        const duplicates = items.value.filter((entry) => {
            console.error(entry.cName, name);
            return entry.cName === name;
        });
        console.error(duplicates, duplicates.length);
        return duplicates.length > 0;
    });
    const getNames = computed(() => items.value.map(item => item.cName));
    const getNamesWithIndex = computed(() => items.value.map((item, index) => ({
        name: item.cName,
        index
    })));
    function addBookingType(bookingType, prepend = false) {
        log('BOOKING_TYPES_STORE: addBookingType');
        if (prepend) {
            items.value.unshift(bookingType);
        }
        else {
            items.value.push(bookingType);
        }
    }
    function updateBookingType(bookingType) {
        log('BOOKING_TYPES_STORE: updateBookingType');
        const index = getBookingTypeIndexById.value(bookingType.cID);
        if (index !== -1) {
            items.value[index] = { ...bookingType };
        }
    }
    function deleteBookingType(ident) {
        log('BOOKING_TYPE_STORE: deleteBookingType', { info: ident });
        const index = getBookingTypeIndexById.value(ident);
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
        getBookingTypeById,
        getBookingTypeNameById,
        getBookingTypeIndexById,
        getNames,
        getNamesWithIndex,
        isDuplicate,
        addBookingType,
        deleteBookingType,
        updateBookingType,
        clean
    };
});
log('--- STORES bookingTypes.ts ---');
