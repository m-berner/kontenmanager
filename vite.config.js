/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {defineConfig} from 'vite'
import {fileURLToPath, URL} from 'url'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import {viteStaticCopy} from 'vite-plugin-static-copy'
import zipPack from 'vite-plugin-zip-pack'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
    const isTest = mode === 'test'

    return {
        plugins: [
            vue(),
            vuetify({autoImport: true}),
            !isTest && viteStaticCopy({
                targets: [
                    {
                        src: 'manifest.json',
                        dest: './',
                        overwrite: true
                    },
                    {
                        src: 'assets/icon64.png',
                        dest: 'assets/',
                        overwrite: true
                    },
                    {
                        src: 'assets/icon16.png',
                        dest: 'assets/',
                        overwrite: true
                    },
                    {
                        src: 'assets/connection48.png',
                        dest: 'assets/',
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
        ].filter(Boolean),
        assetsInclude: ['**/*.svg', '**/*.png'],
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
            target: ['es2022', 'firefox140'],
            assetsDir: 'assets',
            assetsInlineLimit: 0,
            emptyOutDir: false,
            outDir: '../kontenmanager@gmx.de',
            modulePreload: false,
            rollupOptions: {
                input: {
                    background: 'src/entrypoints/background.html',
                    app: 'src/entrypoints/app.html',
                    options: 'src/entrypoints/options.html'
                },
                output: {
                    entryFileNames: 'entrypoints/[name].js',
                    chunkFileNames: '[name].js',
                    assetFileNames: 'assets/[name].[ext]',
                    format: 'es'
                }
            }
        },
        test: {
            globals: true,
            environment: 'happy-dom',
            root: '.',
            include: ['src/**/*.test.ts']
        }
    }
})
