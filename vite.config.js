import {defineConfig} from 'vite'
import {fileURLToPath, URL} from 'url'
//import {dirname, resolve} from 'path'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
//import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import {viteStaticCopy} from 'vite-plugin-static-copy'
import zipPack from 'vite-plugin-zip-pack'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vuetify({ autoImport: true }),
        // VueI18nPlugin({
        //     runtimeOnly: true,
        //     compositionOnly: true,
        //     include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**')
        // }),
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
