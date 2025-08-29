/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import globals from 'globals'
import * as parserVue from 'vue-eslint-parser'
import pluginVue from 'eslint-plugin-vue'

export default [
    {
        // Global configuration
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: parserVue,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                parser: '@typescript-eslint/parser' // if using TypeScript
            },
            globals: {
                ...globals,
                process: 'readonly',
                amd: 'off',
                applescript: 'off',
                atomtest: 'off',
                browser: 'readonly',
                builtin: 'off',
                chai: 'off',
                commonjs: 'off',
                couch: 'off',
                devtools: 'off',
                embertest: 'off',
                es2015: 'off',
                es2016: 'off',
                es2017: 'off',
                es2018: 'off',
                es2019: 'off',
                es2020: 'off',
                es2021: 'off',
                es2022: 'off',
                es2023: 'off',
                es2024: 'off',
                es2025: 'off',
                es2026: 'readonly',
                es3: 'off',
                es5: 'readonly',
                greasemonkey: 'off',
                jasmine: 'off',
                jest: 'off',
                jquery: 'off',
                meteor: 'off',
                mocha: 'off',
                mongo: 'off',
                nashorn: 'off',
                node: 'readonly',
                nodeBuiltin: 'readonly',
                phantomjs: 'off',
                prototypejs: 'off',
                protractor: 'off',
                qunit: 'off',
                rhino: 'off',
                serviceworker: 'writeable',
                'shared-node-browser': 'off',
                shelljs: 'off',
                vitest: 'readonly',
                webextensions: 'writeable',
                worker: 'readonly',
                wsh: 'off',
                yui: 'off'
            }
        },
        // Files to lint
        files: ['**/*.{js,ts,vue}'],

        // Rules configuration
        rules: {
            'no-console': 'warn',
            'no-debugger': 'warn',
            'no-unused-vars': ['error', {'argsIgnorePattern': '^_'}],
            'prefer-const': 'error',
            'no-var': 'error',
            'object-shorthand': 'error',
            'prefer-template': 'error',
            'template-curly-spacing': 'error',
            'arrow-spacing': 'error',
            'comma-dangle': ['error', 'never'],
            'quotes': ['error', 'single'],
            'semi': ['error', 'never'],
            //'indent': ['error', 2, {'SwitchCase': 1}],
            'space-before-function-paren': ['error', 'always'],
            'keyword-spacing': 'error',
            'space-infix-ops': 'error',
            'eol-last': 'error',
            'no-trailing-spaces': 'error',
            'no-multiple-empty-lines': ['error', {'max': 1, 'maxEOF': 0}],

            // Import rules
            'sort-imports': ['error', {
                'ignoreCase': false,
                'ignoreDeclarationSort': true,
                'ignoreMemberSort': false,
                'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single']
            }]
        }
    },
    {
        // Specific configuration for Vue files
        files: ['**/*.vue'],
        plugins: {
            vue: pluginVue
        },
        rules: {
            'indent': ['error', 2],
            'vue/script-indent': ['error', 2, {'baseIndent': 0}],
            //'vue/html-indent': ['error', 0, {'baseIndent': 2}],
            'vue/multi-word-component-names': 'error',
            'vue/component-definition-name-casing': ['error', 'PascalCase'],
            'vue/component-name-in-template-casing': ['error', 'PascalCase'],
            'vue/define-macros-order': ['error', {
                order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots']
            }],
            'vue/define-emits-declaration': ['error', 'type-based'],
            'vue/define-props-declaration': ['error', 'type-based'],
            'vue/enforce-style-attribute': ['error', {'allow': ['scoped', 'module']}],
            'vue/html-self-closing': ['error', {
                'html': {
                    'void': 'always',
                    'normal': 'always',
                    'component': 'always'
                },
                'svg': 'always',
                'math': 'always'
            }],
            'vue/max-attributes-per-line': ['error', {
                'singleline': {'max': 3},
                'multiline': {'max': 1}
            }],
            'vue/no-v-html': 'warn',
            'vue/padding-line-between-blocks': ['error', 'always'],
            'vue/prefer-import-from-vue': 'error',
            'vue/require-default-prop': 'error',
            'vue/require-explicit-emits': 'error'
            //'vue/v-on-event-hyphenation': ['error', 'always', {'autofix': true}]
        }
    },
    {
        // Specific configuration for Vue files
        files: ['**/*.js'],
        rules: {
            'indent': ['error', 4]
        }
    },
    {
        // Specific configuration for Vue files
        files: ['**/*.ts'],
        rules: {
            'indent': ['error', 1, {baseIndent: 2, 'SwitchCase': 1}]
        }
    },
    {
        // Configuration for test files
        files: ['**/__tests__/**', '**/*.{test,spec}.{js,ts}'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                vi: 'readonly'
            }
        }
    },
    {
        // Files to ignore
        ignores: [
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/node_modules/**',
            '**/.nuxt/**',
            '**/.output/**',
            '**/.vite/**',
            '**/public/**',
            '**/.idea/**',
            '**/kontenmanager@gmx.de/**',
            '**/releases/**'
        ]
    }
]
