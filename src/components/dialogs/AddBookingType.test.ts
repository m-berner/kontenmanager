/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { databaseService } from "@/services/database";
import { INDEXED_DB } from "@/config/database";
import { useBookingTypeForm } from "@/composables/useForms";
import { useSettingsStore } from "@/stores/settings";
import { useRecordsStore } from "@/stores/records";

// Mock browser API
const browserMock = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined)
    }
  },
  notifications: {
    create: vi.fn().mockResolvedValue(undefined)
  },
  runtime: {
    getURL: vi.fn().mockReturnValue(""),
    getManifest: vi.fn().mockReturnValue({ version: "1.0.0" })
  },
  i18n: {
    getUILanguage: vi.fn().mockReturnValue("de-DE")
  }
};
vi.stubGlobal("browser", browserMock);

describe("AddBookingType Logic Test", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());

    // Mock connection state
    vi.spyOn(databaseService, "isConnected").mockReturnValue(true);
  });

  it("should add a booking type and verify it reaches the database service", async () => {
    const { bookingTypeFormData, mapBookingTypeFormToDb } =
      useBookingTypeForm();
    const records = useRecordsStore();
    const settings = useSettingsStore();

    // 0. Setup active account
    settings.activeAccountId = 1;

    // 1. Setup form data
    bookingTypeFormData.name = "Test Type";

    // 2. Mock the DB add operation success
    const addSpy = vi.spyOn(databaseService, "add").mockResolvedValue(101);

    // 3. Directly test the mapping and adding logic (simulating onClickOk's core operation)
    // Ensure no duplicate (isDuplicate is a computed property returning a function)
    expect(records.bookingTypes.isDuplicate("Test Type")).toBe(false);

    const bookingTypeData = mapBookingTypeFormToDb(settings.activeAccountId);
    const addBookingTypeID = await databaseService.add(
      INDEXED_DB.STORE.BOOKING_TYPES.NAME,
      bookingTypeData
    );

    if (addBookingTypeID !== -1) {
      records.bookingTypes.add({
        ...bookingTypeData,
        cID: addBookingTypeID as number
      });
    }

    // 4. Verify database interaction
    expect(addSpy).toHaveBeenCalledWith(
      INDEXED_DB.STORE.BOOKING_TYPES.NAME,
      expect.objectContaining({
        cName: "test type",
        cAccountNumberID: 1
      })
    );

    // 5. Verify store updates
    expect(records.bookingTypes.items).toHaveLength(1);
    expect(records.bookingTypes.items[0].cID).toBe(101);
    expect(records.bookingTypes.items[0].cName).toBe("test type");
  });
});
