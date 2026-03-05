/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {databaseService} from "@/services/database/service";

/**
 * Shared repository instances from the database service
 * This file maintains the public API for repositories while using the centralized database service.
 */
export const accountsRepository = databaseService.getRepository("accounts");
export const bookingsRepository = databaseService.getRepository("bookings");
export const bookingTypesRepository = databaseService.getRepository("bookingTypes");
export const stocksRepository = databaseService.getRepository("stocks");
