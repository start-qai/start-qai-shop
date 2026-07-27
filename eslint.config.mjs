import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.tsbuildinfo",
      "apps/frontend/public/**",
      "apps/backend/prisma/migrations/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Shared usage: unused args prefixed with _ are intentional.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "warn",
    },
  },

  // Backend + shared run on Node.
  {
    files: ["apps/backend/**/*.{ts,tsx}", "packages/shared/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Standalone Node scripts (build/codegen helpers).
  {
    files: ["**/scripts/**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
    },
  },

  // Frontend runs in the browser.
  {
    files: ["apps/frontend/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },

  // Tests use both Node and browser-like globals (jsdom/vitest).
  {
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}", "**/test/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },

  // Keep ESLint out of Prettier's formatting territory.
  prettier,
);
