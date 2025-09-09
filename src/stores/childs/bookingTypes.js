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
        return items.value.findIndex((entry) => entry.cID === ident);
    });
    function addBookingType(bookingType, prepend = false) {
        log('BOOKING_TYPES_STORE: addBookingType');
        if (prepend) {
            items.value.unshift(bookingType);
        }
        else {
            items.value.push(bookingType);
        }
    }
    function deleteBookingType(ident) {
        log('BOOKING_TYPE_STORE: deleteBookingType', { info: ident });
        const index = getBookingTypeById.value(ident);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }
    function clean() {
        log('BOOKING_TYPES_STORE: cleanStore');
        items.value.length = 0;
    }
    return {
        items,
        getBookingTypeById,
        getBookingTypeNameById,
        addBookingType,
        deleteBookingType,
        clean
    };
});
log('--- STORE bookingTypes.ts ---');
