/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import stylisticTs from '@stylistic/eslint-plugin-ts'
import stylisticJs from '@stylistic/eslint-plugin-js'

// noinspection JSUnresolvedReference
export default [
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    {
        files: ['**/*.ts'],
        plugins: {
            '@stylistic/ts': stylisticTs
        }, rules: {
            'indent': ['error', 4, {'SwitchCase': 1}],
            '@stylistic/ts/indent': ['error', 4, {'SwitchCase': 1}],
            'semi': ['error', 'never'],
            '@stylistic/ts/semi': ['error', 'never']
        }
    }, {
        files: ['**/*.js'],
        plugins: {
            '@stylistic/js': stylisticJs
        },
        rules: {
            'indent': ['error', 4],
            '@stylistic/js/indent': ['error', 4]
        }
    }, {
        files: ['**/*.vue'],
        languageOptions: {
            parser: pluginVue.parser,
            parserOptions: {
                parser: tseslint.parser,
                ecmaVersion: 2022,
                sourceType: 'module',
                extraFileExtensions: ['.vue']
            },
            globals: {
                browser: true,
                node: true,
                es2022: true
            }
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            'vue': pluginVue
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-unused-expressions': 'off',
            'vue/multi-word-component-names': 'off',
            'indent': ['error', 2, {'SwitchCase': 1}],
            'semi': ['error', 'never']
        }
    }, {
        files: ['**/*.{html,ts}'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser
            }
        },
        rules: {
            '@typescript-eslint/no-namespace': 0
        }
    }
]
