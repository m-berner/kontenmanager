<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { UtilsService } from "@/domains/utils";

UtilsService.log("--- views/HelpContent.vue setup ---");
</script>

<template>
  <v-container class="pa-4" fluid>
    <v-row>
      <v-col class="mx-auto" cols="12" lg="8" md="10">
        <v-card variant="flat">
          <v-card-title class="text-h5 mb-2"> Help · Hilfe </v-card-title>

          <v-card-text class="text-body-1">
            <v-divider class="mb-4" />

            <!-- Overview -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">Overview</h3>
              <p>
                KontenManager helps you manage bank accounts, bookings, and a
                stock depot. Use the Home view for account bookings and the
                Company view for stocks and depot value.
              </p>

              <h3 class="text-h6 mt-4 mb-2">Überblick</h3>
              <p>
                KontenManager unterstützt Sie bei der Verwaltung von Bankkonten,
                Buchungen und einem Aktiendepot. Verwenden Sie die Startseite
                für Kontobuchungen und die Firmenansicht für Aktien und
                Depotwert.
              </p>
            </section>

            <!-- Getting Started -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">Getting started</h3>
              <ul>
                <li>
                  Create an account via the menu in the header (Add Account).
                </li>
                <li>
                  Import an existing database or export your data via the menu.
                </li>
                <li>
                  The account selector appears in the title bar once an account
                  exists.
                </li>
              </ul>

              <h3 class="text-h6 mt-4 mb-2">Erste Schritte</h3>
              <ul>
                <li>
                  Legen Sie ein Konto über das Menü in der Kopfleiste an (Konto
                  hinzufügen).
                </li>
                <li>
                  Importieren Sie eine bestehende Datenbank oder exportieren Sie
                  Ihre Daten über das Menü.
                </li>
                <li>
                  Der Kontoauswahlschalter erscheint in der Titelleiste, sobald
                  ein Konto vorhanden ist.
                </li>
              </ul>
            </section>

            <!-- Bookings -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">Bookings</h3>
              <ul>
                <li>Add, update, or delete bookings using the header menu.</li>
                <li>
                  Booking types can be configured (Add/Update/Delete Booking
                  Type).
                </li>
                <li>
                  The balance (sum of bookings) is shown in the title bar on
                  Home.
                </li>
              </ul>

              <h3 class="text-h6 mt-4 mb-2">Buchungen</h3>
              <ul>
                <li>
                  Fügen Sie Buchungen hinzu, bearbeiten oder löschen Sie diese
                  über das Menü in der Kopfleiste.
                </li>
                <li>
                  Buchungsarten können konfiguriert werden (Buchungsart
                  hinzufügen/ändern/löschen).
                </li>
                <li>
                  Die Summe der Buchungen (Saldo) wird auf der Startseite in der
                  Titelleiste angezeigt.
                </li>
              </ul>
            </section>

            <!-- Stocks / Depot -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">Stocks / Depot</h3>
              <ul>
                <li>
                  Switch to the Company view to manage stocks and view depot
                  value.
                </li>
                <li>
                  Use the Info bar to see exchange/index/material counters and
                  details.
                </li>
                <li>
                  On Company view the account selector is disabled; the title
                  bar shows the depot sum.
                </li>
              </ul>

              <h3 class="text-h6 mt-4 mb-2">Aktien / Depot</h3>
              <ul>
                <li>
                  Wechseln Sie zur Firmenansicht, um Aktien zu verwalten und den
                  Depotwert zu sehen.
                </li>
                <li>
                  Die Infoleiste zeigt Zähler und Details zu
                  Börsen/Indizes/Materialien.
                </li>
                <li>
                  In der Firmenansicht ist die Kontoauswahl deaktiviert; die
                  Titelleiste zeigt die Depot-Summe.
                </li>
              </ul>
            </section>

            <!-- Settings / Options -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">Settings / Options</h3>
              <ul>
                <li>
                  Open the extension options from the header menu (Settings).
                </li>
                <li>
                  Some settings are stored in the browser and are loaded on
                  startup.
                </li>
              </ul>

              <h3 class="text-h6 mt-4 mb-2">Einstellungen / Optionen</h3>
              <ul>
                <li>
                  Öffnen Sie die Erweiterungsoptionen über das Menü in der
                  Kopfleiste (Einstellungen).
                </li>
                <li>
                  Einige Einstellungen werden im Browser gespeichert und beim
                  Start geladen.
                </li>
              </ul>
            </section>

            <!-- Keyboard Shortcuts -->
            <section class="mb-6">
              <h3 class="text-h6 mb-2">Keyboard shortcuts</h3>
              <p>
                No global keyboard shortcuts are defined. Use menu actions via
                mouse/touch.
              </p>

              <h3 class="text-h6 mt-4 mb-2">Tastaturkürzel</h3>
              <p>
                Es sind keine globalen Tastenkürzel definiert. Verwenden Sie die
                Menüaktionen mit Maus/Touch.
              </p>
            </section>

            <!-- Privacy -->
            <section class="mb-2">
              <h3 class="text-h6 mb-2">Privacy</h3>
              <p>
                See the Privacy page for details. Links are available in the
                footer.
              </p>

              <h3 class="text-h6 mt-4 mb-2">Datenschutz</h3>
              <p>
                Details finden Sie auf der Datenschutz-Seite. Links befinden
                sich in der Fußzeile.
              </p>
            </section>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.nowrap {
  white-space: nowrap;
}
</style>
