/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import globals from "globals";
import * as parserVue from "vue-eslint-parser";
import pluginVue from "eslint-plugin-vue";

export default [
  // Base configs (applies to JS/TS/Vue)
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
        ...globals["browser"],
        ...globals.node,
        ...globals["webextensions"],
        ...globals.worker
      }
    },
    plugins: {
      vue: pluginVue
    },
    rules: {
      // Keep ESLint focused on correctness/quality, not formatting.
      // Formatting is handled by the IDE "Format Code" action.
      "no-console": "warn",
      "no-debugger": "warn",
      "no-unused-vars": ["off"], //, { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "template-curly-spacing": "off",
      "arrow-spacing": "off",
      "comma-dangle": "off",
      quotes: "off",
      semi: "off",
      "keyword-spacing": "off",
      "space-infix-ops": "off",
      "eol-last": "off",
      "no-trailing-spaces": "off",
      "no-multiple-empty-lines": "off",
      "sort-imports": "off",

      // Start from Vue recommended and adjust to the project
      ...pluginVue["configs"]["flat/recommended"].rules,
      // Project adjustments for Vue SFCs
      // Disable vue/script-indent to avoid false positives in <script setup>
      // blocks (e.g., nested ternaries/try-catch) and rely on general
      // indentation rules instead. This resolves errors like those seen in
      // TitleBar.vue while keeping a consistent style across the project.
      "vue/script-indent": "off",
      // Templates commonly use both PascalCase (RouterLink) and kebab (v-components)
      "vue/component-name-in-template-casing": "off",
      // Default props are not always required when using TypeScript
      "vue/require-default-prop": "off",
      //
      "vue/no-unused-vars": "error"
    }
  },

  // Explicitly disable space-before-function-paren to let the formatter decide spacing
  {
    rules: {
      "space-before-function-paren": "off"
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
      "**/js/**",
      "**/kontenmanager@gmx.de/**",
      "**/releases/**"
    ]
  }
];
