<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed} from 'vue'
import {useMenuActions} from '@/composables/useMenuActions'
import {useMenuHighlight} from '@/composables/useMenuHighlight'
import MenuItem from '@/components/MenuItem.vue'
import type {I_Menu_Config, I_Menu_Item} from '@/types'
import {useApp} from '@/composables/useApp'

const props = defineProps<I_Menu_Config>()
const {log} = useApp()
const {executeAction} = useMenuActions()
const {highlightedItems, highlightTemporary, clearAllHighlights} = useMenuHighlight()

const currentColor = computed(() => highlightedItems.value.get(props.recordId) || '')

const handleMenuOpen = () => {
    log('DOT_MENU: handleMenuOpen', {info: props.recordId})
    highlightTemporary(props.recordId)
}

const handleItemClick = async (item: I_Menu_Item) => {
    log('DOT_MENU: handleItemClick', {info: [props.recordId, item.action]})

    try {
        // Default action handling
        await executeAction(item.action, props.recordId)
        clearAllHighlights()
    } catch (error) {
        log('DOT_MENU: action failed', {error})
    }
}

log('--- DotMenu.vue setup ---')
</script>

<template>
    <v-menu>
        <template v-slot:activator="{ props: menuProps }">
            <v-btn
                :color="currentColor"
                aria-label="Open menu"
                icon="$dots"
                v-bind="menuProps"
                @click="handleMenuOpen"
            />
        </template>

        <v-list role="menu">
            <MenuItem
                v-for="item in items"
                :key="item.id"
                :is-highlighted="highlightedItems.has(recordId)"
                :item="item"
                @click="handleItemClick"
            />
        </v-list>
    </v-menu>
</template>
