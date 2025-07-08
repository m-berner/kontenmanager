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
        files: ['**/*.ts'], plugins: {
            '@stylistic/ts': stylisticTs
        }, rules: {
            'indent': ['error', 2, {'SwitchCase': 1}],
            '@stylistic/ts/indent': ['error', 2, {'SwitchCase': 1}],
            'semi': ['error', 'never'],
            '@stylistic/ts/semi': ['error', 'never']
        }
    }, {
        files: ['**/*.js'], plugins: {
            '@stylistic/js': stylisticJs
        }, rules: {
            'indent': ['error', 4],
            '@stylistic/js/indent': ['error', 4]
            //'semi': ['error', 'never'],
            //'@stylistic/js/semi': ['error', 'never']
        }
    }, {
        files: ['**/*.{vue,ts}'],
        languageOptions: {parserOptions: {parser: tseslint.parser}},
        rules: {
            '@typescript-eslint/no-namespace': 0
        }
    }
]
