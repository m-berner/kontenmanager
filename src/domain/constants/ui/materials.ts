/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {TRANSLATION_KEYS} from "@/domain/constants/ui/translationKeys";
import type {MaterialItemKeyType} from "@/domain/types";

export const createMaterialLabel = (
    t: (_key: string) => string,
    itemKey: MaterialItemKeyType
): string => t(TRANSLATION_KEYS[itemKey]);

