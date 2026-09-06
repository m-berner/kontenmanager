/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * Page sizes offered by the two main data tables (`CompanyContent`,
 * `HomeContent`). Odd-only, because those tables sit in the page body where a
 * wider step is useful.
 *
 * Defaults land inside it: `stocksPerPage` and `bookingsPerPage` are both 9.
 */
export const ITEMS_PER_PAGE_OPTIONS = [
    {value: 5, title: "5"},
    {value: 7, title: "7"},
    {value: 9, title: "9"},
    {value: 11, title: "11"},
    {value: 13, title: "13"}
];

/**
 * Page sizes offered by the dialog data tables (`ShowAccounting`,
 * `ShowDividend`). Contiguous rather than odd-only, and capped lower, because a
 * dialog has less vertical room than the page body.
 *
 * Defaults land inside it: `sumsPerPage` is 11, `dividendsPerPage` is 9.
 *
 * Lives here rather than in the two dialogs, where each declared a *local
 * constant literally named `ITEMS_PER_PAGE_OPTIONS`* with these values —
 * silently shadowing the exported name above, which holds a different list. A
 * reader who had seen one had no reason to suspect the other. Two page-size
 * rules is a legitimate design choice; two things called the same name is not.
 */
export const DIALOG_ITEMS_PER_PAGE_OPTIONS = [
    {value: 5, title: "5"},
    {value: 6, title: "6"},
    {value: 7, title: "7"},
    {value: 8, title: "8"},
    {value: 9, title: "9"},
    {value: 10, title: "10"},
    {value: 11, title: "11"}
];

