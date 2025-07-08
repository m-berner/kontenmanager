/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {defineConfig} from 'vite'
import {fileURLToPath, URL} from 'url'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import {viteStaticCopy} from 'vite-plugin-static-copy'
import zipPack from 'vite-plugin-zip-pack'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vuetify({ autoImport: true }),
        viteStaticCopy({
            targets: [
                {
                    src: 'manifest.json',
                    dest: '../kontenmanager@gmx.de/',
                    overwrite: true
                },
                {
                    src: '../kontenmanager@gmx.de',
                    dest: 'C:/Users/Martin/AppData/Roaming/Mozilla/Firefox/Profiles/developer.mb/extensions/',
                    overwrite: true
                }
            ]
        }),
        zipPack({
            inDir: './kontenmanager@gmx.de',
            outDir: 'C:/Users/Martin/Projekte/Privat/kontenmanager/releases/firefox',
            outFileName: 'kontenmanager@gmx.de.xpi'
        })
    ],
    root: './src',
    base: './',
    resolve: {
        alias: [
            {
                find: '@',
                replacement: fileURLToPath(new URL('./src', import.meta.url))
            }
        ]
    },
    build: {
        minify: false,
        cssMinify: false,
        target: ['es2022', 'firefox132'],
        assetsDir: 'assets',
        assetsInlineLimit: 0,
        emptyOutDir: false,
        outDir: '../kontenmanager@gmx.de',
        modulePreload: false,
        rollupOptions: {
            input: {
                background: 'src/pages/background.js',
                app: 'src/pages/app.html',
                options: 'src/pages/options.html'
            },
            output: {
                entryFileNames: 'pages/[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: 'assets/[name].[ext]',
                format: 'es'
            }
        }
    }
})
