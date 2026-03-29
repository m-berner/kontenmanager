/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {TRANSLATION_KEYS} from "@/domain/constants/ui/translationKeys";
import type {MenuItemData} from "@/domain/types";

export const createHomeMenuItems = (t: (_key: string) => string): readonly MenuItemData[] =>
    [
        {
            id: "update-booking",
            title: t(TRANSLATION_KEYS.HOME_MENU_UPDATE),
            icon: "$updateBooking",
            action: "updateBooking",
            variant: "danger"
        },
        {
            id: "delete-booking",
            title: t(TRANSLATION_KEYS.HOME_MENU_DELETE),
            icon: "$deleteBooking",
            action: "deleteBooking"
        }
    ] as const;

export const createCompanyMenuItems = (t: (_key: string) => string): readonly MenuItemData[] =>
    [
        {
            id: "update-stock",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_UPDATE),
            icon: "$showCompany",
            action: "updateStock"
        },
        {
            id: "delete-stock",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_DELETE),
            icon: "$deleteCompany",
            action: "deleteStock",
            variant: "danger"
        },
        {
            id: "show-dividend",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_DIVIDEND),
            icon: "$showDividend",
            action: "showDividend"
        },
        {
            id: "open-link",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_LINK),
            icon: "$link",
            action: "openLink"
        }
    ] as const;

