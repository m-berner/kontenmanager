/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import globals from "globals";
import * as parserVue from "vue-eslint-parser";
import pluginVue from "eslint-plugin-vue";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  // Architecture guardrails
  {
    files: [
      "src/adapters/primary/components/**/*.{js,ts,vue}",
      "src/adapters/primary/views/**/*.{js,ts,vue}",
      "src/adapters/primary/composables/**/*.{js,ts,vue}"
    ],
    rules: {
      // UI code should access services via DI (useServices), not import concrete modules.
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/infra/services/*", "!@/infra/services/context", "!@/infra/services/types"],
            message: "Import services via '@/infra/services/context' (useServices) and types via '@/infra/services/types'."
          }
        ]
      }]
    }
  },
  {
    files: ["src/adapters/primary/components/**/*.{test,spec}.{js,ts,vue}", "src/adapters/primary/composables/**/*.{test,spec}.{js,ts,vue}", "src/adapters/primary/views/**/*.{test,spec}.{js,ts,vue}"],
    rules: {
      // Tests may import concrete services directly.
      "no-restricted-imports": "off"
    }
  },
  {
    files: ["src/**/*.{js,ts,vue}"],
    ignores: [
      "src/adapters/primary/entrypoints/**",
      "src/adapters/secondary/**",
      "src/domain/**",
      "src/**/__tests__/**",
      "src/**/*.{test,spec}.{js,ts,vue}"
    ],
    rules: {
      // Creating the service container is an entrypoint concern.
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@test/*"],
            message: "Test helpers are test-only. Do not import '@test/*' from src/ runtime code."
          }
        ],
        paths: [
          {
            name: "@/infra/services/container",
            message: "Only entrypoints should import '@/infra/services/container'. Use '@/infra/services/context' in runtime code."
          }
        ]
      }]
    }
  },
  {
    files: ["src/domain/**/*.{js,ts,vue}"],
    rules: {
      // Domain must stay framework- and infrastructure-agnostic.
      "no-restricted-imports": ["error", {
        patterns: [
          "@/infra/services/*",
          "@test/*",
          "@/infra/stores/*",
          "vue",
          "vue/*",
          "pinia",
          "pinia/*",
          "vuetify",
          "vuetify/*",
          "vue-router",
          "vue-router/*",
          "vue-i18n",
          "vue-i18n/*"
        ]
      }]
    }
  },
  {
    files: ["src/domain/**/*.{test,spec}.{js,ts,vue}"],
    rules: {
      // Tests may use helpers from other layers for setup/mocking.
      "no-restricted-imports": "off"
    }
  },
  {
    files: ["src/adapters/primary/stores/**/*.ts"],
    rules: {
      // Stores should receive services via deps injection, not import them directly.
      "no-restricted-imports": ["error", {patterns: ["@/infra/services/*", "@test/*"]}]
    }
  },
  {
    files: ["src/adapters/primary/stores/**/*.{test,spec}.ts"],
    rules: {
      // Tests may mock/import services directly.
      "no-restricted-imports": "off"
    }
  },

  // Usecases must depend on ports, not concrete services.
  {
    files: ["src/app/usecases/**/*.{js,ts}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/infra/services/*"],
            message: "Usecases must not import concrete services. Depend on ports in '@/app/usecases/ports' and inject implementations at the boundary."
          }
        ]
      }]
    }
  },

  // General rule: outside the service/entrypoint layer, only import the DI surface from services.
  {
    files: ["src/**/*.{js,ts,vue}"],
    ignores: ["src/adapters/secondary/**", "src/adapters/primary/entrypoints/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/infra/services/*", "!@/infra/services/context", "!@/infra/services/types"],
            message: "Outside services/entrypoints, only import '@/infra/services/context' (DI) and '@/infra/services/types' (types)."
          }
        ]
      }]
    }
  },

  // Import ordering
  {
    files: ["src/**/*.{js,ts,vue}"],
    plugins: {
      "simple-import-sort": simpleImportSort
    },
    rules: {
      "simple-import-sort/imports": ["error", {
        groups: [
          ["^(?!@/)(?!\\.)[^.]"],  // External libraries
          ["^@/app/"],              // App layer
          ["^@/domain/"],           // Domain layer
          ["^@/infra/"],            // Infra layer
          ["^\\."]                  // Relative imports (fallback)
        ]
      }],
      "simple-import-sort/exports": "error"
    }
  },

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
    files: [
      "**/__tests__/**",
      "**/*.{test,spec}.{js,ts,vue}"
    ],
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
