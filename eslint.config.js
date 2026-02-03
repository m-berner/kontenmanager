/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import globals from "globals";
import * as parserVue from "vue-eslint-parser";
import pluginVue from "eslint-plugin-vue";

export default [
  // Base config (applies to JS/TS/Vue)
  {
    files: ["**/*.{js,ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: parserVue,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        parser: "@typescript-eslint/parser"
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.webextensions,
        ...globals.worker
      }
    },
    plugins: {
      vue: pluginVue
    },
    rules: {
      // General JS/TS style aligned with the current codebase
      "no-console": "warn",
      "no-debugger": "warn",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "template-curly-spacing": "error",
      "arrow-spacing": "error",
      "comma-dangle": ["error", "never"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      // Allow a space for async arrow functions: `async () => {}`
      // "space-before-function-paren": [
      //   "error",
      //   {
      //     anonymous: "always",
      //     named: "never",
      //     asyncArrow: "always"
      //   }
      // ],
      "keyword-spacing": "error",
      "space-infix-ops": "error",
      "eol-last": "error",
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],

      // Import sorting for consistency (but keep declaration order)
      "sort-imports": [
        "error",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"]
        }
      ],

      // Start from Vue recommended and adjust to the project
      ...pluginVue.configs["flat/recommended"].rules,
      // Project adjustments for Vue SFCs
      // Disable vue/script-indent to avoid false positives in <script setup>
      // blocks (e.g., nested ternaries/try-catch) and rely on general
      // indentation rules instead. This resolves errors like those seen in
      // TitleBar.vue while keeping a consistent style across the project.
      "vue/script-indent": "off",
      // Templates commonly use both PascalCase (RouterLink) and kebab (v-components)
      "vue/component-name-in-template-casing": "off",
      // Default props are not always required when using TypeScript
      "vue/require-default-prop": "off"
    }
  },

  // Explicitly disable space-before-function-paren to let Prettier decide spacing
  {
    rules: {
      "space-before-function-paren": "off"
    }
  },

  // JS-only rules
  {
    files: ["**/*.js"],
    rules: {
      indent: ["error", 2]
    }
  },

  // TS-only rules
  {
    files: ["**/*.ts"],
    rules: {
      indent: ["error", 2, { SwitchCase: 1 }]
      // Keep the same policy for TS files
      // "space-before-function-paren": [
      //   "error",
      //   {
      //     anonymous: "never",
      //     named: "never",
      //     asyncArrow: "always"
      //   }
      // ]
    }
  },

  // Test files (Vitest)
  {
    files: ["**/__tests__/**", "**/*.{test,spec}.{js,ts,vue}"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly"
      }
    }
  },

  // Ignore patterns
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/.vite/**",
      "**/public/**",
      "**/.idea/**",
      "**/kontenmanager@gmx.de/**",
      "**/releases/**"
    ]
  }
];
