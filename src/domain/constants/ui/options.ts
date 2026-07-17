/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {TRANSLATION_KEYS} from "@/domain/constants/ui/translationKeys";
import type {OptionTab} from "@/domain/types";

export const createThemes = (t: (_key: string) => string): Record<string, string> => ({
    // NOTE: lowercase properties required due to the vuetify plugin object
    earth: t(TRANSLATION_KEYS.THEME_EARTH),
    ocean: t(TRANSLATION_KEYS.THEME_OCEAN),
    sky: t(TRANSLATION_KEYS.THEME_SKY),
    meadow: t(TRANSLATION_KEYS.THEME_MEADOW),
    dark: t(TRANSLATION_KEYS.THEME_DARK),
    light: t(TRANSLATION_KEYS.THEME_LIGHT)
});

export const createTabs = (t: (_key: string) => string): readonly OptionTab[] =>
    [
        {title: t(TRANSLATION_KEYS.TAB_GE), id: "register_ge"},
        {title: t(TRANSLATION_KEYS.TAB_MP), id: "register_mp"},
        {title: t(TRANSLATION_KEYS.TAB_IND), id: "register_ind"},
        {title: t(TRANSLATION_KEYS.TAB_MAT), id: "register_mat"},
        {title: t(TRANSLATION_KEYS.TAB_EX), id: "register_ex"}
    ] as const;

