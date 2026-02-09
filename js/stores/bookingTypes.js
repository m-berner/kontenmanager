import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { DomainUtils } from "@/domains/utils";
export const useBookingTypesStore = defineStore("bookingTypes", function () {
    const items = ref([]);
    const getNameById = computed(() => (ident) => {
        const bookingType = items.value.find((entry) => entry.cID === ident);
        return bookingType !== undefined ? bookingType.cName : "";
    });
    const getItemById = computed(() => (id) => items.value[getIndexById.value(id)]);
    const getById = computed(() => (ident) => {
        const bookingType = items.value.find((entry) => entry.cID === ident);
        return bookingType ? bookingType : null;
    });
    const getIndexById = computed(() => (id) => {
        return items.value.findIndex((bookingType) => bookingType.cID === id);
    });
    const isDuplicate = computed(() => (name, excludeId) => {
        const normalizedInput = DomainUtils.normalizeBookingTypeName(name);
        return items.value.some((entry) => {
            const isSameName = DomainUtils.normalizeBookingTypeName(entry.cName) ===
                normalizedInput;
            const isNotExcluded = excludeId === undefined || entry.cID !== excludeId;
            return isSameName && isNotExcluded;
        });
    });
    const getNames = computed(() => items.value.map((item) => item.cName));
    const getNamesWithIndex = computed(() => items.value.map((item, index) => ({
        name: item.cName,
        index
    })));
    function add(bookingType, prepend = false) {
        DomainUtils.log("BOOKING_TYPES_STORE: add");
        if (prepend) {
            items.value.unshift(bookingType);
        }
        else {
            items.value.push(bookingType);
        }
    }
    function update(bookingType) {
        DomainUtils.log("BOOKING_TYPES_STORE: update");
        const index = getIndexById.value(bookingType.cID);
        if (index !== -1) {
            items.value[index] = { ...bookingType };
        }
    }
    function remove(ident) {
        DomainUtils.log("BOOKING_TYPE_STORE: remove", ident, "info");
        const index = getIndexById.value(ident);
        if (index !== -1) {
            items.value.splice(index, 1);
        }
    }
    function clean() {
        DomainUtils.log("BOOKING_TYPES_STORE: clean");
        items.value = [];
    }
    return {
        items,
        getById,
        getNameById,
        getItemById,
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
DomainUtils.log("STORES bookingTypes");
